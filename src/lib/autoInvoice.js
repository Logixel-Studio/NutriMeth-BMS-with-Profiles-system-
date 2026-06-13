/**
 * autoInvoice.js
 * Generates a sequential invoice number and auto-creates an invoice
 * from a sale or purchase. Called AFTER the record is saved.
 * Invoice number format: INV-000001 (global sequence, never duplicated)
 */
import { supabase } from '@/lib/supabase';

/** Get next invoice number: INV-XXXXXX (global across all invoice types) */
export async function getNextInvoiceNumber() {
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', 'INV-%')
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) {
    console.warn('Invoice number fetch error:', error.message);
  }

  const latest = data?.[0]?.invoice_number;
  if (!latest) return 'INV-000001';

  const num = parseInt(latest.replace('INV-', ''), 10);
  return `INV-${String(num + 1).padStart(6, '0')}`;
}

/**
 * Auto-create invoice from a Sale record
 * @param {object} sale - the saved Sale record
 * @param {object} currentUser - { id, full_name, email, role }
 * @param {object} companySettings - optional company info
 */
export async function autoInvoiceFromSale(sale, currentUser, companySettings = {}) {
  try {
    const invNumber = await getNextInvoiceNumber();

    const saleItems = sale.items?.length
      ? sale.items
      : [{ product_name: sale.product_name, qty: sale.qty, unit_price: sale.unit_price, total: sale.total }];

    const items = saleItems.map(it => ({
      description: it.product_name || '',
      qty:         Number(it.qty) || 1,
      unit_price:  Number(it.unit_price) || 0,
      total:       Number(it.qty) * Number(it.unit_price),
    }));

    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const taxAmount = (subtotal * (companySettings.tax_rate || 0)) / 100;
    const grandTotal = subtotal + taxAmount;
    const paid = sale.payment_status === 'paid' ? grandTotal : (sale.paid_amount || 0);

    const payload = {
      invoice_number:   invNumber,
      invoice_type:     'client',
      party_id:         sale.client_id   || '',
      party_name:       sale.client_name || '',
      party_phone:      sale.client_phone   || '',
      party_address:    sale.client_address || '',
      invoice_date:     new Date().toISOString().slice(0, 10),
      due_date:         sale.due_date || null,
      linked_record_ids:[sale.id],
      items,
      subtotal,
      tax_percent:      companySettings.tax_rate || 0,
      tax_amount:       taxAmount,
      discount_percent: 0,
      discount_amount:  0,
      grand_total:      grandTotal,
      paid_amount:      paid,
      remaining_amount: grandTotal - paid,
      payment_status:   sale.payment_status || 'unpaid',
      notes:            sale.description || '',
      company_phone:    companySettings.phone   || '',
      company_email:    companySettings.email   || '',
      company_website:  companySettings.website || '',
      company_address:  companySettings.address || '',
      created_date:     new Date().toISOString(),
      updated_date:     new Date().toISOString(),
      created_by_id:    currentUser?.id    || '',
      created_by_name:  currentUser?.full_name || '',
      created_by_email: currentUser?.email || '',
      created_by_role:  currentUser?.role  || '',
    };

    const { data, error } = await supabase.from('invoices').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Auto-invoice (sale) failed:', err.message);
    throw err;
  }
}

/**
 * Auto-create invoice from a Purchase record
 */
export async function autoInvoiceFromPurchase(purchase, currentUser, companySettings = {}) {
  try {
    const invNumber = await getNextInvoiceNumber();

    const pItems = purchase.items?.length
      ? purchase.items
      : [{ purchase_type_name: purchase.purchase_type_name, qty: purchase.qty, unit_price: purchase.unit_price, total: purchase.total }];

    const items = pItems.map(it => ({
      description: it.purchase_type_name || it.description || '',
      qty:         Number(it.qty) || 1,
      unit_price:  Number(it.unit_price) || 0,
      total:       Number(it.qty) * Number(it.unit_price),
    }));

    const subtotal   = items.reduce((s, i) => s + i.total, 0);
    const grandTotal = subtotal;
    const paid       = purchase.payment_status === 'paid' ? grandTotal : (purchase.paid_amount || 0);

    const payload = {
      invoice_number:   invNumber,
      invoice_type:     'supplier',
      party_id:         purchase.supplier_id   || '',
      party_name:       purchase.supplier_name || '',
      party_phone:      purchase.supplier_phone   || '',
      party_address:    purchase.supplier_address || '',
      invoice_date:     new Date().toISOString().slice(0, 10),
      due_date:         purchase.due_date || null,
      linked_record_ids:[purchase.id],
      items,
      subtotal,
      tax_percent:      0,
      tax_amount:       0,
      discount_percent: 0,
      discount_amount:  0,
      grand_total:      grandTotal,
      paid_amount:      paid,
      remaining_amount: grandTotal - paid,
      payment_status:   purchase.payment_status || 'unpaid',
      notes:            purchase.description || '',
      company_phone:    companySettings.phone   || '',
      company_email:    companySettings.email   || '',
      company_website:  companySettings.website || '',
      company_address:  companySettings.address || '',
      created_date:     new Date().toISOString(),
      updated_date:     new Date().toISOString(),
      created_by_id:    currentUser?.id    || '',
      created_by_name:  currentUser?.full_name || '',
      created_by_email: currentUser?.email || '',
      created_by_role:  currentUser?.role  || '',
    };

    const { data, error } = await supabase.from('invoices').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Auto-invoice (purchase) failed:', err.message);
    throw err;
  }
}
