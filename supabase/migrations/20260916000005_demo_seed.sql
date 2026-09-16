-- ============================================================================
-- SANAD V1 — 022: Demo seed data
-- ============================================================================
-- Minimal dataset covering all entities and scenarios.
-- Run AFTER 018-021 migrations.
--
-- Verified constraint values:
--   work_items.priority: low|medium|high|urgent (NOT critical)
--   report_issues.severity: low|medium|high|critical
--   report_issues.status: open|in_progress|resolved|closed
--   documents.status: draft|sent|approved|rejected
--   company_memberships: no created_by column
--   company_config_lists: requires 'category' column
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- COMPANIES (3 demo companies)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.companies (id, company_code, short_name, name_en, name_ar, country, city, phone, email, default_currency, default_vat_rate, created_by)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'FULLA', 'Fulla', 'Fulla Trading', 'شركة فولة للتجارة', 'Saudi Arabia', 'Riyadh', '+966112345678', 'info@fulla.com', 'SAR', 15, '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000002', 'GBC', 'GBC', 'GBC Exports', 'شركة جي بي سي للتصدير', 'Saudi Arabia', 'Jeddah', '+966122345678', 'info@gbc.com', 'USD', 0, '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000003', 'KAYAN', 'Kayan', 'Kayan Supplies', 'شركة كيان للمواد', 'Saudi Arabia', 'Dammam', '+966133456789', 'info@kayan.com', 'SAR', 15, '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT (id) DO UPDATE SET name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar;

-- ══════════════════════════════════════════════════════════════════════════════
-- COMPANY MEMBERSHIPS (no created_by column)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.company_memberships (company_id, user_id, base_role, active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'admin', true),
  ('a0000000-0000-0000-0000-000000000002', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'admin', true),
  ('a0000000-0000-0000-0000-000000000003', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'admin', true)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- CUSTOMERS (12 demo across 3 companies)
-- Fulla: b1-b6, b9, b10 | GBC: b7, b11 | Kayan: b8, b12
-- ══════════════════════════════════════════════════════════════════════════════

-- Fulla customers
INSERT INTO public.customers (id, company_id, name, name_ar, contact_person, email, phone, country, city, default_currency, payment_terms, created_by)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Al-Rashid Trading', 'الراشد للتجارة', 'Omar Al-Rashid', 'omar@alrashid.com', '+966501234567', 'Saudi Arabia', 'Riyadh', 'SAR', 'Net 30 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('b1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Gulf Construction Co.', 'شركة الخليج للمقاولات', 'Saeed Gulf', 'saeed@gulfconstr.com', '+971502345678', 'UAE', 'Dubai', 'USD', 'Net 60 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('b1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Cairo Building Materials', 'مواد البناء القاهرة', 'Ahmed Cairo', 'ahmed@cairobm.com', '+201012345678', 'Egypt', 'Cairo', 'USD', 'Net 30 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('b1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Istanbul Exports', 'استانبول للتصدير', 'Mehmet Istanbul', 'mehmet@istanbulexp.com', '+905321234567', 'Turkey', 'Istanbul', 'USD', 'Net 45 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('b1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'London Stone Ltd', 'لندن ستون المحدودة', 'James London', 'james@londonstone.co.uk', '+442071234567', 'UK', 'London', 'GBP', 'Net 30 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('b1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Jeddah Concrete', 'جدة للخرسانة', 'Ali Jeddah', 'ali@jeddahconcrete.com', '+966122345678', 'Saudi Arabia', 'Jeddah', 'SAR', 'Net 30 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('b1000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Bahrain Imports', 'البحرين للاستيراد', 'Nasser Bahrain', 'nasser@bahrainimp.bh', '+97312345678', 'Bahrain', 'Manama', 'BHD', 'Net 30 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('b1000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Oman Trading', 'عُمان للتجارة', 'Sultan Oman', 'sultan@omantrading.om', '+96891234567', 'Oman', 'Muscat', 'OMR', 'Net 60 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar;

-- GBC customers
INSERT INTO public.customers (id, company_id, name, name_ar, contact_person, email, phone, country, city, default_currency, payment_terms, created_by)
VALUES
  ('b1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'Doha Projects', 'دoha للمشاريع', 'Khalid Doha', 'khalid@dohaprojects.qa', '+97450123456', 'Qatar', 'Doha', 'USD', 'Net 45 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('b1000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'Pakistan Materials', 'باكستان للمواد', 'Hassan Pakistan', 'hassan@pakmat.pk', '+923001234567', 'Pakistan', 'Karachi', 'USD', 'Net 30 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar;

-- Kayan customers
INSERT INTO public.customers (id, company_id, name, name_ar, contact_person, email, phone, country, city, default_currency, payment_terms, created_by)
VALUES
  ('b1000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'Kuwait Builders', 'الكويت للمقاولين', 'Yusuf Kuwait', 'yusuf@kuwaitbuilders.com', '+96550123456', 'Kuwait', 'Kuwait City', 'KWD', 'Net 30 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('b1000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000003', 'India Exports', 'الهند للتصدير', 'Raj India', 'raj@indiaexp.in', '+919876543210', 'India', 'Mumbai', 'INR', 'Net 45 days', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar;

-- ══════════════════════════════════════════════════════════════════════════════
-- MATERIALS (15 demo)
-- Fulla: c1-c6, c12, c13 | GBC: c7-c9, c14 | Kayan: c10, c11, c15
-- ══════════════════════════════════════════════════════════════════════════════

-- Fulla materials
INSERT INTO public.materials (id, company_id, name, grade, category, unit, origin_country, hs_code, manufacturer, created_by)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Portland Cement', 'Type I', 'Cement', 'MT', 'Saudi Arabia', '2523.29', 'Saudi Cement', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'White Cement', 'Type V', 'Cement', 'MT', 'Turkey', '2523.29', 'Aslan Cement', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Gypsum Board', 'Standard', 'Building', 'MT', 'UAE', '6810.11', 'National Gypsum', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Ceramic Tiles', '60x60', 'Tiles', 'MT', 'China', '6907.21', 'Pearl Ceramic', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Steel Rebar', 'Grade 60', 'Steel', 'MT', 'Saudi Arabia', '7213.99', 'SABIC', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Aluminum Profiles', '6063', 'Aluminum', 'MT', 'UAE', '7604.21', 'Emirates Aluminum', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'PVC Pipes', 'Class 5', 'Plumbing', 'MT', 'Saudi Arabia', '3917.23', 'SARICO', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Insulation', 'Rock Wool', 'Insulation', 'MT', 'Germany', '6806.90', 'Rockwool', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, grade = EXCLUDED.grade;

-- GBC materials
INSERT INTO public.materials (id, company_id, name, grade, category, unit, origin_country, hs_code, manufacturer, created_by)
VALUES
  ('c1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'Copper Wire', 'Grade A', 'Copper', 'MT', 'Chile', '7408.11', 'Codelco', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000002', 'Marble Slabs', 'White', 'Stone', 'MT', 'Turkey', '6802.91', 'Bilecik Marble', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002', 'Granite Tiles', 'Black', 'Stone', 'MT', 'India', '6802.91', 'Bangalore Granite', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002', 'Paint', 'Exterior', 'Coating', 'MT', 'USA', '3208.90', 'Sherwin Williams', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, grade = EXCLUDED.grade;

-- Kayan materials
INSERT INTO public.materials (id, company_id, name, grade, category, unit, origin_country, hs_code, manufacturer, created_by)
VALUES
  ('c1000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'Sand', 'Construction', 'Aggregate', 'MT', 'Saudi Arabia', '2505.00', 'Local Quarry', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000003', 'Gravel', '20mm', 'Aggregate', 'MT', 'Saudi Arabia', '2516.11', 'Local Quarry', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('c1000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000003', 'Bolts and Nuts', 'Grade 8.8', 'Hardware', 'KG', 'China', '7318.15', 'Fastenal', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, grade = EXCLUDED.grade;

-- ══════════════════════════════════════════════════════════════════════════════
-- WORK ITEMS (12 projects + 8 tasks)
-- priority: low|medium|high|urgent (NOT critical)
-- ══════════════════════════════════════════════════════════════════════════════

-- Projects (with customer_id)
INSERT INTO public.work_items (id, company_id, type, name, description, status, customer_id, priority, created_by)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'project', 'Al-Rashid Cement Shipment', 'Portland Cement 5000 MT to Riyadh', 'in_progress', 'b1000000-0000-0000-0000-000000000001', 'high', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'project', 'Gulf Steel Export', 'Steel Rebar 2000 MT to Dubai', 'in_progress', 'b1000000-0000-0000-0000-000000000002', 'high', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'project', 'Cairo Tiles Order', 'Ceramic Tiles 800 MT to Egypt', 'completed', 'b1000000-0000-0000-0000-000000000003', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'project', 'Istanbul Aluminum', 'Aluminum Profiles 300 MT to Turkey', 'in_progress', 'b1000000-0000-0000-0000-000000000004', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'project', 'Doha Construction', 'Multi-material to Qatar', 'in_progress', 'b1000000-0000-0000-0000-000000000007', 'urgent', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'project', 'Kuwait Supply', 'Aggregate supply to Kuwait', 'in_progress', 'b1000000-0000-0000-0000-000000000008', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'project', 'London Stone Import', 'Building materials to UK', 'archived', 'b1000000-0000-0000-0000-000000000005', 'low', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'project', 'Jeddah Concrete Mix', 'Cement and Gypsum for Jeddah', 'in_progress', 'b1000000-0000-0000-0000-000000000006', 'high', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000002', 'project', 'Pakistan Copper', 'Copper Wire to Karachi', 'cancelled', 'b1000000-0000-0000-0000-000000000011', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'project', 'India Granite Export', 'Black Granite to Mumbai', 'in_progress', 'b1000000-0000-0000-0000-000000000011', 'high', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'project', 'Bahrain PVC Order', 'PVC Pipes to Bahrain', 'in_progress', 'b1000000-0000-0000-0000-000000000009', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'project', 'Oman Insulation', 'Rock Wool Insulation to Muscat', 'in_progress', 'b1000000-0000-0000-0000-000000000010', 'low', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Tasks (no customer_id)
INSERT INTO public.work_items (id, company_id, type, name, description, status, priority, created_by)
VALUES
  ('d1000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'task', 'Follow up with Al-Rashid on payment', 'Check payment status for invoice INV-001', 'in_progress', 'high', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'task', 'Prepare packing list for Gulf Steel', 'PKL document for steel shipment', 'in_progress', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'task', 'Review Istanbul shipment docs', 'Verify all documents for Turkey shipment', 'completed', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000002', 'task', 'Update Doha project pricing', 'Recalculate prices for Qatar order', 'in_progress', 'high', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'task', 'Schedule Kuwait delivery', 'Coordinate shipping with Kuwait buyer', 'in_progress', 'low', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'task', 'Quality check on Jeddah materials', 'Inspect cement samples', 'in_progress', 'urgent', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'task', 'Archive completed Cairo project', 'Move Cairo tiles to archived', 'completed', 'low', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('d1000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'task', 'Update factory code database', 'Import latest factory registrations', 'in_progress', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ══════════════════════════════════════════════════════════════════════════════
-- WORK ITEM MATERIALS (all company-aligned)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.work_item_materials (work_item_id, material_id, quantity, unit_price, currency, sort_order)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 5000, 280, 'SAR', 1),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005', 2000, 3200, 'SAR', 1),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006', 100, 8500, 'SAR', 2),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 800, 180, 'SAR', 1),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000006', 300, 8500, 'SAR', 1),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000007', 3000, 5500, 'USD', 1),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000008', 500, 4200, 'USD', 2),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000009', 1500, 3800, 'USD', 3),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000010', 4000, 45, 'SAR', 1),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000011', 2000, 55, 'SAR', 2),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003', 300, 320, 'SAR', 1),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000004', 200, 180, 'SAR', 2),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001', 2000, 280, 'SAR', 1),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000003', 1500, 320, 'SAR', 2),
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000007', 600, 5500, 'USD', 1),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000009', 600, 3800, 'USD', 1),
  ('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000012', 400, 1200, 'SAR', 1),
  ('d1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000013', 200, 3500, 'SAR', 1)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTES (10 demo)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.notes (company_id, work_item_id, content, created_by)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Customer confirmed quantity of 5000 MT. Ready to prepare proforma.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Payment received: 30% advance. Ship when ready.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'Steel grade confirmed. Need to update shipping marks.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'Container booking confirmed for next week.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'Aluminum specifications verified with customer.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000005', 'Qatar project scope expanded. Added marble and granite.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000008', 'Quality inspection scheduled for Saturday.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000006', 'Kuwait buyer requested delay to next month.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000013', 'Payment reminder sent via email. Awaiting response.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000014', 'PKL draft prepared. Needs review before sending.', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- REPORT ISSUES (8 demo)
-- status: open|in_progress|resolved|closed
-- severity: low|medium|high|critical
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.report_issues (company_id, work_item_id, title, description, status, severity, reported_by, assigned_to)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Quantity discrepancy', 'Customer received 4980 MT instead of 5000 MT', 'open', 'high', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'Delayed shipment', 'Shipping delayed by 3 days due to customs', 'in_progress', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'Wrong grade shipped', 'Customer received Grade 6061 instead of 6063', 'resolved', 'critical', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000008', 'Damaged packaging', 'Some cement bags damaged during loading', 'open', 'low', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000005', 'Price adjustment needed', 'USD exchange rate changed significantly', 'open', 'high', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000006', 'Delivery address change', 'Kuwait buyer changed warehouse address', 'in_progress', 'medium', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000010', 'Documentation incomplete', 'Missing certificate of origin for India', 'open', 'high', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', '4eb1be6c-6f42-4256-bd98-df6b34c61d87'),
  ('a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000012', 'Insulation spec mismatch', 'Customer requested different R-value', 'resolved', 'low', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', '4eb1be6c-6f42-4256-bd98-df6b34c61d87')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- TODOS (10 demo)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.todos (company_id, user_id, title, description, priority, due_date, is_done)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Send proforma to Al-Rashid', 'Prepare and send QUOT document', 'high', CURRENT_DATE + INTERVAL '2 days', false),
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Review packing list draft', 'Check PKL for Gulf Steel shipment', 'medium', CURRENT_DATE + INTERVAL '3 days', false),
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Update customer contacts', 'Add new contact for Istanbul client', 'low', CURRENT_DATE + INTERVAL '7 days', false),
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Follow up on payment', 'Check payment status from Doha buyer', 'high', CURRENT_DATE + INTERVAL '1 day', false),
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Prepare quality report', 'Generate quality certificate for Jeddah', 'medium', CURRENT_DATE + INTERVAL '5 days', false),
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Schedule team meeting', 'Weekly project review meeting', 'low', CURRENT_DATE + INTERVAL '4 days', true),
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Update factory code import', 'Import latest factory registrations', 'medium', CURRENT_DATE + INTERVAL '6 days', false),
  ('a0000000-0000-0000-0000-000000000002', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Prepare shipping documents', 'BL, PL, CI for Bahrain order', 'high', CURRENT_DATE + INTERVAL '2 days', false),
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Review archived projects', 'Check if any can be reopened', 'low', CURRENT_DATE + INTERVAL '14 days', false),
  ('a0000000-0000-0000-0000-000000000001', '4eb1be6c-6f42-4256-bd98-df6b34c61d87', 'Update material prices', 'Review and update latest selling prices', 'medium', CURRENT_DATE + INTERVAL '10 days', false)
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- DOCUMENTS (20 demo across all 7 types)
-- status: draft|sent|approved|rejected
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.documents (id, company_id, work_item_id, customer_id, type, number, date, language, status, currency, prepared_by)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'QUOT', 'QUOT-001', CURRENT_DATE, 'en', 'sent', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'QUOT', 'QUOT-002', CURRENT_DATE, 'ar', 'draft', 'USD', 'Admin'),
  ('e1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'PINV', 'PINV-001', CURRENT_DATE, 'en', 'approved', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'PINV', 'PINV-002', CURRENT_DATE, 'en', 'approved', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'PINV', 'PINV-003', CURRENT_DATE, 'ar', 'draft', 'USD', 'Admin'),
  ('e1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'TINV', 'TINV-001', CURRENT_DATE, 'en', 'sent', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'TINV', 'TINV-002', CURRENT_DATE, 'en', 'sent', 'USD', 'Admin'),
  ('e1000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'TINV', 'TINV-003', CURRENT_DATE, 'ar', 'draft', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'CINV', 'CINV-001', CURRENT_DATE, 'en', 'approved', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'CINV', 'CINV-002', CURRENT_DATE, 'en', 'sent', 'USD', 'Admin')
ON CONFLICT (id) DO UPDATE SET number = EXCLUDED.number;

INSERT INTO public.documents (id, company_id, work_item_id, customer_id, type, number, date, language, status, currency, prepared_by)
VALUES
  ('e1000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000006', 'CINV', 'CINV-003', CURRENT_DATE, 'ar', 'draft', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'PKL', 'PKL-001', CURRENT_DATE, 'en', 'approved', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'PKL', 'PKL-002', CURRENT_DATE, 'en', 'sent', 'USD', 'Admin'),
  ('e1000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'PKL', 'PKL-003', CURRENT_DATE, 'ar', 'draft', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'DN', 'DN-001', CURRENT_DATE, 'en', 'sent', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'DN', 'DN-002', CURRENT_DATE, 'en', 'sent', 'USD', 'Admin'),
  ('e1000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'DN', 'DN-003', CURRENT_DATE, 'ar', 'draft', 'USD', 'Admin'),
  ('e1000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'BL', 'BL-001', CURRENT_DATE, 'en', 'approved', 'SAR', 'Admin'),
  ('e1000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'BL', 'BL-002', CURRENT_DATE, 'en', 'sent', 'USD', 'Admin'),
  ('e1000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'BL', 'BL-003', CURRENT_DATE, 'ar', 'draft', 'USD', 'Admin')
ON CONFLICT (id) DO UPDATE SET number = EXCLUDED.number;

-- ══════════════════════════════════════════════════════════════════════════════
-- DOCUMENT TEMPLATES (seed)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.document_templates (template_code, display_name, document_type, family, supports_ar, supports_en, native)
VALUES
  ('fulla-commercial-invoice-680', 'Fulla Commercial Invoice', 'CINV', 'fulla', true, true, true),
  ('fulla-proforma-680', 'Fulla Proforma Invoice', 'PINV', 'fulla', true, true, true),
  ('fulla-tax-invoice-680', 'Fulla Tax Invoice', 'TINV', 'fulla', true, true, true),
  ('fulla-quotation-680', 'Fulla Quotation', 'QUOT', 'fulla', true, true, true),
  ('fulla-packing-list-680', 'Fulla Packing List', 'PKL', 'fulla', true, true, true),
  ('fulla-delivery-note-680', 'Fulla Delivery Note', 'DN', 'fulla', true, true, true),
  ('fulla-bill-of-lading-680', 'Fulla Bill of Lading', 'BL', 'fulla', true, true, true),
  ('template-a', 'Standard Template', 'CINV', 'standard', true, true, false),
  ('template-b', 'Arabic Template', 'CINV', 'arabic', true, false, false)
ON CONFLICT (template_code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- COMPANY CONFIG LISTS (currency, incoterm, weight_unit, packing_unit)
-- requires category column = list_name
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.company_config_lists (company_id, list_name, item_value, category, is_default, sort_order)
SELECT c.id, v.list_name, v.item_value, v.list_name, v.is_default, v.sort_order
FROM public.companies c
CROSS JOIN (VALUES
  ('currency', 'SAR', true, 1),
  ('currency', 'USD', false, 2),
  ('currency', 'EUR', false, 3),
  ('currency', 'GBP', false, 4),
  ('currency', 'AED', false, 5),
  ('currency', 'KWD', false, 6),
  ('currency', 'QAR', false, 7),
  ('currency', 'BHD', false, 8),
  ('currency', 'OMR', false, 9),
  ('currency', 'INR', false, 10),
  ('currency', 'TRY', false, 11),
  ('currency', 'EGP', false, 12),
  ('currency', 'PKR', false, 13)
) AS v(list_name, item_value, is_default, sort_order)
WHERE c.id IN ('a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO public.company_config_lists (company_id, list_name, item_value, category, is_default, sort_order)
SELECT c.id, v.list_name, v.item_value, v.list_name, v.is_default, v.sort_order
FROM public.companies c
CROSS JOIN (VALUES
  ('incoterm', 'FOB', true, 1),
  ('incoterm', 'CIF', false, 2),
  ('incoterm', 'CFR', false, 3),
  ('incoterm', 'EXW', false, 4),
  ('incoterm', 'DDP', false, 5),
  ('incoterm', 'FCA', false, 6)
) AS v(list_name, item_value, is_default, sort_order)
WHERE c.id IN ('a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO public.company_config_lists (company_id, list_name, item_value, category, is_default, sort_order)
SELECT c.id, v.list_name, v.item_value, v.list_name, v.is_default, v.sort_order
FROM public.companies c
CROSS JOIN (VALUES
  ('weight_unit', 'MT', true, 1),
  ('weight_unit', 'KG', false, 2),
  ('weight_unit', 'LBS', false, 3),
  ('weight_unit', 'TON', false, 4)
) AS v(list_name, item_value, is_default, sort_order)
WHERE c.id IN ('a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

INSERT INTO public.company_config_lists (company_id, list_name, item_value, category, is_default, sort_order)
SELECT c.id, v.list_name, v.item_value, v.list_name, v.is_default, v.sort_order
FROM public.companies c
CROSS JOIN (VALUES
  ('packing_unit', 'bags', true, 1),
  ('packing_unit', 'pallets', false, 2),
  ('packing_unit', 'containers', false, 3),
  ('packing_unit', 'drums', false, 4),
  ('packing_unit', 'rolls', false, 5)
) AS v(list_name, item_value, is_default, sort_order)
WHERE c.id IN ('a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;