/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import {
  INITIAL_EQUIPMENT,
  INITIAL_TRANSACTIONS,
  INITIAL_SAFETY_STATUS,
  SAFETY_PRESET_MESSAGES,
  STUDENT_PRESETS,
} from './src/data/seedData.ts';
import { EQUIPMENT_SVG_MAP } from './src/data/equipmentImages.ts';
import type {
  Equipment,
  BasketItem,
  CheckoutSession,
  StudentTransactionLog,
  SafetyStatusState,
  SafetyStatusLevel,
} from './src/types.ts';

const PORT = Number(process.env.PORT || 3000);

// Ensure static SVG files exist in /public/images/equipment for both Python Flask and Express
const eqImgDir = path.resolve(process.cwd(), 'public', 'images', 'equipment');
try {
  fs.mkdirSync(eqImgDir, { recursive: true });
  for (const [qrCode, svgContent] of Object.entries(EQUIPMENT_SVG_MAP)) {
    fs.writeFileSync(path.join(eqImgDir, `${qrCode}.svg`), svgContent, 'utf-8');
  }
} catch {
  // ignore in read-only environments
}

function enrichEquipmentWithImages(list: Equipment[]): Equipment[] {
  return list.map((item) => ({
    ...item,
    image_url: item.image_url || `/images/equipment/${item.qr_code}.svg`,
  }));
}

// Server-authoritative database state
let equipmentList: Equipment[] = enrichEquipmentWithImages(structuredClone(INITIAL_EQUIPMENT));
let transactionLogs: StudentTransactionLog[] = structuredClone(INITIAL_TRANSACTIONS);
let safetyStatus: SafetyStatusState = structuredClone(INITIAL_SAFETY_STATUS);
const checkoutSessions: Map<string, CheckoutSession> = new Map();

// WebSocket channels
const checkoutSockets: Map<string, Set<WebSocket>> = new Map();
const globalSockets: Set<WebSocket> = new Set();

function broadcastToCheckoutSession(token: string, payload: unknown) {
  const clients = checkoutSockets.get(token);
  if (!clients) return;
  const msg = JSON.stringify(payload);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function broadcastGlobalUpdate(payload: unknown) {
  const msg = JSON.stringify(payload);
  for (const ws of globalSockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function generateSessionToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'CHK-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '/', `http://${request.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/ws/checkout/')) {
      const token = pathname.replace('/ws/checkout/', '').trim();
      wss.handleUpgrade(request, socket, head, (ws) => {
        if (!checkoutSockets.has(token)) {
          checkoutSockets.set(token, new Set());
        }
        checkoutSockets.get(token)!.add(ws);
        ws.on('close', () => {
          checkoutSockets.get(token)?.delete(ws);
        });
      });
    } else if (pathname === '/ws/kiosk' || pathname === '/ws/hardware') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        globalSockets.add(ws);
        ws.send(
          JSON.stringify({
            event: 'state_sync',
            safety_status: safetyStatus,
          })
        );
        ws.on('close', () => {
          globalSockets.delete(ws);
        });
      });
    } else {
      socket.destroy();
    }
  });

  // ============================================================================
  // Equipment SVG Image Route (/images/equipment/:filename)
  // ============================================================================
  app.get('/images/equipment/:filename', (req, res) => {
    const code = req.params.filename.replace(/\.svg$/i, '').toUpperCase();
    const svg = EQUIPMENT_SVG_MAP[code] || EQUIPMENT_SVG_MAP['LG-EQ-002'];
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  // ============================================================================
  // 3 SEPARATE HTML FILES ROUTES (/kiosk, /student/checkout/:token, /admin)
  // ============================================================================
  const templatesDir = path.resolve(process.cwd(), 'templates');

  app.get(['/', '/kiosk', '/kiosk.html'], (_req, res) => {
    res.sendFile(path.join(templatesDir, 'kiosk.html'));
  });

  app.get(['/student/checkout/:token', '/student_form.html'], (_req, res) => {
    res.sendFile(path.join(templatesDir, 'student_form.html'));
  });

  app.get(['/admin', '/admin.html'], (_req, res) => {
    res.sendFile(path.join(templatesDir, 'admin.html'));
  });

  // ============================================================================
  // Unified State & Kiosk / Admin API Endpoints
  // ============================================================================
  app.get('/api/state', (_req, res) => {
    res.json({
      equipment: equipmentList,
      transactions: transactionLogs,
      safety_status: safetyStatus,
      student_presets: STUDENT_PRESETS,
    });
  });

  app.post('/api/kiosk/checkout-session', async (req, res) => {
    try {
      if (safetyStatus.level === 'UNSAFE') {
        res.status(403).json({
          error:
            'Laboratory LED Safety Status is currently RED (UNSAFE). Equipment checkout is paused.',
        });
        return;
      }

      const rawItems = Array.isArray(req.body?.basket_items) ? req.body.basket_items : [];
      if (rawItems.length === 0) {
        res
          .status(400)
          .json({ error: 'Please select at least one equipment item in your basket.' });
        return;
      }

      const validatedBasket: BasketItem[] = [];
      for (const item of rawItems) {
        const eq = equipmentList.find((e) => e.id === Number(item.equipment_id) && e.is_active);
        if (!eq) {
          res.status(404).json({ error: `Equipment item #${item.equipment_id} not found.` });
          return;
        }
        const qty = Math.max(1, Number(item.quantity || 1));
        if (qty > eq.available_qty) {
          res.status(400).json({
            error: `Insufficient stock for ${eq.name} (${eq.available_qty} available).`,
          });
          return;
        }
        validatedBasket.push({
          equipment_id: eq.id,
          qr_code: eq.qr_code,
          name: eq.name,
          category: eq.category,
          image_url: eq.image_url || `/images/equipment/${eq.qr_code}.svg`,
          storage_compartment: eq.storage_compartment,
          quantity: qty,
          unit: eq.unit,
          safety_level: eq.safety_level,
          prerequisites: eq.prerequisites,
        });
      }

      const token = generateSessionToken();
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000);

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers.host || `localhost:${PORT}`;
      const baseUrl = process.env.APP_URL
        ? process.env.APP_URL.replace(/\/$/, '')
        : `${protocol}://${host}`;
      const mobileUrl = `${baseUrl}/student/checkout/${token}`;

      const qrDataUrl = await QRCode.toDataURL(mobileUrl, {
        width: 300,
        margin: 1,
        color: {
          dark: '#003087',
          light: '#FFFFFF',
        },
      });

      const session: CheckoutSession = {
        session_token: token,
        basket_items: validatedBasket,
        qr_data_url: qrDataUrl,
        mobile_url: mobileUrl,
        status: 'pending_student_info',
        created_at: createdAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      checkoutSessions.set(token, session);
      res.status(201).json({ session });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/kiosk/checkout-session/:token', (req, res) => {
    const token = req.params.token;
    const session = checkoutSessions.get(token);
    if (!session) {
      res.status(404).json({ error: 'Checkout QR session not found or expired.' });
      return;
    }
    res.json({
      session,
      safety_status: safetyStatus,
      student_presets: STUDENT_PRESETS,
    });
  });

  app.post('/api/kiosk/checkout-session/:token/complete', (req, res) => {
    const token = req.params.token;
    const session = checkoutSessions.get(token);

    const basketItems: BasketItem[] = session
      ? session.basket_items
      : Array.isArray(req.body?.basket_items)
      ? req.body.basket_items
      : [];

    if (session && session.status === 'completed' && session.completed_transaction) {
      res.json({
        success: true,
        transaction: session.completed_transaction,
      });
      return;
    }

    if (basketItems.length === 0) {
      res.status(400).json({ error: 'No equipment items found in checkout session.' });
      return;
    }

    const studentName = String(req.body?.student_name || '').trim();
    const studentIdLrn = String(req.body?.student_id_lrn || '').trim();
    const gradeSection = String(req.body?.grade_section || '').trim();
    const schoolEmail = String(req.body?.school_email || '').trim().toLowerCase();
    const subjectActivity = String(req.body?.subject_activity || '').trim();
    const teacherName = String(req.body?.teacher_name || '').trim();
    const expectedReturnHours = Number(req.body?.expected_return_hours || 2);
    const safetyChecked: string[] = Array.isArray(req.body?.safety_prerequisites_checked)
      ? req.body.safety_prerequisites_checked
      : [];

    if (!studentName || !studentIdLrn || !gradeSection || !subjectActivity || !teacherName) {
      res.status(400).json({
        error:
          'Please fill in your Full Name, Student ID / LRN, Grade & Section, Subject / Activity, and Supervising Teacher.',
      });
      return;
    }

    for (const item of basketItems) {
      const eq = equipmentList.find((e) => e.id === Number(item.equipment_id));
      if (!eq || eq.available_qty < item.quantity) {
        res.status(400).json({
          error: `${item.name} no longer has sufficient stock available.`,
        });
        return;
      }
    }

    let hasCautionItem = false;
    let totalItemsCount = 0;

    for (const item of basketItems) {
      const eq = equipmentList.find((e) => e.id === Number(item.equipment_id))!;
      eq.available_qty = Math.max(0, eq.available_qty - item.quantity);
      totalItemsCount += item.quantity;
      if (eq.safety_level === 'CAUTION') {
        hasCautionItem = true;
      }
    }

    const nextId = transactionLogs.reduce((max, t) => Math.max(max, t.id), 100) + 1;
    const nowIso = new Date().toISOString();
    const expectedIso = new Date(
      Date.now() + Math.max(0.5, expectedReturnHours) * 3600 * 1000
    ).toISOString();

    const newTransaction: StudentTransactionLog = {
      id: nextId,
      transaction_code: `LG-JRC-${nextId}`,
      student_name: studentName,
      student_id_lrn: studentIdLrn,
      grade_section: gradeSection,
      school_email:
        schoolEmail || `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@arellano.edu.ph`,
      subject_activity: subjectActivity,
      teacher_name: teacherName,
      items: basketItems,
      total_items_count: totalItemsCount,
      safety_prerequisites_checked:
        safetyChecked.length > 0
          ? safetyChecked
          : [
              'Wearing buttoned laboratory gown & PPE',
              'Inspected apparatus condition prior to use',
              'Following AU-JRC Science Laboratory safety rules',
            ],
      time_in: nowIso,
      expected_return: expectedIso,
      time_out: null,
      return_condition: null,
      return_notes: '',
      status: 'Borrowed / In Lab',
    };

    transactionLogs.unshift(newTransaction);

    if (hasCautionItem && safetyStatus.level === 'SAFE') {
      safetyStatus = {
        level: 'CAUTION',
        headline: SAFETY_PRESET_MESSAGES.CAUTION.headline,
        message: `Active checkout (${newTransaction.transaction_code} · ${newTransaction.student_name}) includes thermal or glassware apparatus. PPE and teacher supervision required.`,
        updated_by: 'LabGuard+ Automated Safety Monitor',
        updated_at: nowIso,
      };
    }

    if (session) {
      session.status = 'completed';
      session.completed_transaction = newTransaction;
      broadcastToCheckoutSession(token, {
        event: 'checkout_completed',
        transaction: newTransaction,
      });
    }

    broadcastGlobalUpdate({
      event: 'data_updated',
      transaction: newTransaction,
      safety_status: safetyStatus,
    });

    res.status(201).json({
      success: true,
      transaction: newTransaction,
      safety_status: safetyStatus,
    });
  });

  app.post('/api/kiosk/return', (req, res) => {
    const txId = Number(req.body?.transaction_id || 0);
    const txCode = String(req.body?.transaction_code || '').trim().toUpperCase();
    const condition: 'Good' | 'Damaged' | 'Missing' =
      req.body?.return_condition === 'Damaged' || req.body?.return_condition === 'Missing'
        ? req.body.return_condition
        : 'Good';
    const notes = String(req.body?.return_notes || '').trim();

    const record = transactionLogs.find(
      (t) => (txId && t.id === txId) || (txCode && t.transaction_code.toUpperCase() === txCode)
    );

    if (!record) {
      res.status(404).json({ error: 'Borrow transaction record not found.' });
      return;
    }

    if (record.status === 'Returned / Logged Out') {
      res
        .status(400)
        .json({ error: 'This transaction has already been returned and logged out.' });
      return;
    }

    const nowIso = new Date().toISOString();
    record.time_out = nowIso;
    record.return_condition = condition;
    record.return_notes = notes || `Returned in ${condition} condition.`;
    record.status = 'Returned / Logged Out';

    if (condition !== 'Missing') {
      for (const item of record.items) {
        const eq = equipmentList.find((e) => e.id === item.equipment_id);
        if (eq) {
          eq.available_qty = Math.min(eq.total_qty, eq.available_qty + item.quantity);
          if (condition === 'Damaged') {
            eq.condition = 'Damaged';
          }
        }
      }
    }

    if (condition === 'Damaged' || condition === 'Missing') {
      const itemsSummary = record.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      const compartmentsSummary = Array.from(
        new Set(record.items.map((i) => i.storage_compartment).filter(Boolean))
      ).join(', ');
      const nextLevel: SafetyStatusLevel = safetyStatus.level === 'UNSAFE' ? 'UNSAFE' : 'CAUTION';

      safetyStatus = {
        level: nextLevel,
        headline: SAFETY_PRESET_MESSAGES[nextLevel].headline,
        message:
          condition === 'Damaged'
            ? `Damaged apparatus returned (${record.transaction_code}: ${itemsSummary}). Inspect ${compartmentsSummary || 'compartment'} before next use.`
            : `Missing apparatus reported on return (${record.transaction_code}: ${itemsSummary}). Lab Coordinator verification required for ${compartmentsSummary || 'compartment'}.`,
        updated_by: `LabGuard+ Return Monitor (${condition})`,
        updated_at: nowIso,
      };
    }

    broadcastGlobalUpdate({
      event: 'data_updated',
      transaction: record,
      safety_status: safetyStatus,
    });

    res.json({
      success: true,
      transaction: record,
      safety_status: safetyStatus,
    });
  });

  app.post('/api/admin/equipment', (req, res) => {
    const name = String(req.body?.name || '').trim();
    const category = req.body?.category || 'Glassware & Measuring';
    const description = String(req.body?.description || '').trim();
    const compartment = String(req.body?.storage_compartment || '4th - 3rd Section').trim();
    const totalQty = Math.max(1, Number(req.body?.total_qty || 1));
    const unit = String(req.body?.unit || 'unit').trim();
    const safetyLevel = req.body?.safety_level === 'CAUTION' ? 'CAUTION' : 'SAFE';
    const prerequisites: string[] = Array.isArray(req.body?.prerequisites)
      ? req.body.prerequisites.filter(Boolean)
      : ['Wear buttoned laboratory gown and follow AU-JRC safety rules'];

    if (!name) {
      res.status(400).json({ error: 'Equipment name is required.' });
      return;
    }

    const nextId = equipmentList.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    const qrCode =
      String(req.body?.qr_code || '').trim().toUpperCase() ||
      `LG-EQ-${String(nextId).padStart(3, '0')}`;

    const newItem: Equipment = {
      id: nextId,
      qr_code: qrCode,
      name,
      category,
      image_url: String(req.body?.image_url || '').trim() || '/images/equipment/LG-EQ-001.svg',
      description: description || `${name} for AU-JRC Senior High School Science Laboratory.`,
      storage_compartment: compartment,
      total_qty: totalQty,
      available_qty: totalQty,
      unit,
      condition: 'Good',
      safety_level: safetyLevel,
      prerequisites,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    equipmentList.push(newItem);
    broadcastGlobalUpdate({ event: 'data_updated' });
    res.status(201).json({ equipment: newItem });
  });

  app.patch('/api/admin/equipment/:id', (req, res) => {
    const id = Number(req.params.id);
    const eq = equipmentList.find((e) => e.id === id);
    if (!eq) {
      res.status(404).json({ error: 'Equipment not found.' });
      return;
    }

    if (req.body?.name !== undefined) eq.name = String(req.body.name).trim();
    if (req.body?.category !== undefined) eq.category = req.body.category;
    if (req.body?.description !== undefined) eq.description = String(req.body.description).trim();
    if (req.body?.storage_compartment !== undefined)
      eq.storage_compartment = String(req.body.storage_compartment).trim();
    if (req.body?.condition !== undefined) eq.condition = req.body.condition;
    if (req.body?.safety_level !== undefined) eq.safety_level = req.body.safety_level;
    if (req.body?.total_qty !== undefined) {
      const nextTotal = Math.max(0, Number(req.body.total_qty));
      const borrowedCount = Math.max(0, eq.total_qty - eq.available_qty);
      eq.total_qty = nextTotal;
      eq.available_qty = Math.max(0, nextTotal - borrowedCount);
    }
    if (req.body?.available_qty !== undefined) {
      eq.available_qty = Math.max(0, Math.min(eq.total_qty, Number(req.body.available_qty)));
    }
    if (Array.isArray(req.body?.prerequisites)) {
      eq.prerequisites = req.body.prerequisites.filter(Boolean);
    }

    broadcastGlobalUpdate({ event: 'data_updated' });
    res.json({ equipment: eq });
  });

  app.delete('/api/admin/equipment/:id', (req, res) => {
    const id = Number(req.params.id);
    equipmentList = equipmentList.filter((e) => e.id !== id);
    broadcastGlobalUpdate({ event: 'data_updated' });
    res.json({ success: true });
  });

  app.post('/api/admin/safety-status', (req, res) => {
    const level: SafetyStatusLevel =
      req.body?.level === 'CAUTION' || req.body?.level === 'UNSAFE' ? req.body.level : 'SAFE';
    const preset = SAFETY_PRESET_MESSAGES[level];
    const customMessage = String(req.body?.message || '').trim();
    const updatedBy =
      String(req.body?.updated_by || '').trim() || 'AU-JRC Science Laboratory Personnel';

    safetyStatus = {
      level,
      headline: preset.headline,
      message: customMessage || preset.message,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    };

    broadcastGlobalUpdate({
      event: 'data_updated',
      safety_status: safetyStatus,
    });

    res.json({ safety_status: safetyStatus });
  });

  app.post('/api/reset', (_req, res) => {
    equipmentList = enrichEquipmentWithImages(structuredClone(INITIAL_EQUIPMENT));
    transactionLogs = structuredClone(INITIAL_TRANSACTIONS);
    safetyStatus = structuredClone(INITIAL_SAFETY_STATUS);
    checkoutSessions.clear();
    broadcastGlobalUpdate({ event: 'data_updated', safety_status: safetyStatus });
    res.json({ success: true });
  });

  // Mount Vite or Static Build for any remaining assets
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(templatesDir, 'kiosk.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`LabGuard+ Kiosk Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
