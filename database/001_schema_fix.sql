-- ============================================================
-- DIBYO LURIK - SISTEM MANAJEMEN INTERNAL TOKO
-- Database Schema v4 untuk Supabase (PostgreSQL)
-- ============================================================
-- Total: 12 tabel + triggers + functions + RLS policies + views
-- ============================================================
-- CHANGELOG v4 (dari v3):
--   - orders: tambah diskon (%)
--   - pre_order_reguler: tambah status_pembayaran, total_dp, diskon
--   - pre_order_custom: tambah status_pembayaran, total_dp, diskon
--   - item_pre_order_reguler: tambah jumlah (qty)
--   - subtotal POR item = panjang * jumlah * harga_per_meter
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. PROFILES
-- ============================================================
-- Login: username + password (tanpa email)
-- Supabase Auth handle password (TIDAK disimpan di tabel ini)
-- Di Supabase Auth: email auto-generate → username@dibyo.local
-- Yang bisa daftarkan akun: hanya owner
-- Fitur: register, login, lupa password, edit profil
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL UNIQUE,
  nama VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'kepala_produksi', 'customer_service')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 2. KATEGORI
-- ============================================================
-- Tampilan: list, bisa tambah/edit/hapus
-- Digunakan: dropdown di form produk
-- ============================================================
CREATE TABLE kategori (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_kategori VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. MOTIF
-- ============================================================
-- Tampilan: list, bisa tambah/edit/hapus
-- Digunakan: dropdown di form produk, exception harga (Blok Lurik)
-- ============================================================
CREATE TABLE motif (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_motif VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 4. RAK
-- ============================================================
-- Contoh nama: A, B, C
-- Tampilan: list, bisa tambah/edit/hapus
-- Digunakan: dropdown di form produk, bagian dari kode_produk
-- ============================================================
CREATE TABLE rak (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_rak VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 5. DAFTAR HARGA
-- ============================================================
-- Lookup harga per meter berdasarkan jenis_pewarna + lebar
-- motif_id NULL = berlaku umum
-- motif_id terisi = harga khusus (misal Blok Lurik Sintetis 110cm)
--
-- PRICELIST:
--   Sintetis 70cm  = 38.500  |  Alami 70cm  = 46.500
--   Sintetis 110cm = 57.500  |  Alami 110cm = 67.500
--   Blok Lurik Sintetis 110cm = 60.000
-- ============================================================
CREATE TABLE daftar_harga (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jenis_pewarna VARCHAR(10) NOT NULL CHECK (jenis_pewarna IN ('sintetis', 'alami')),
  motif_id UUID REFERENCES motif(id) ON DELETE RESTRICT,
  lebar INTEGER NOT NULL CHECK (lebar IN (70, 110)),
  harga_per_meter DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_daftar_harga_unique
  ON daftar_harga (jenis_pewarna, COALESCE(motif_id, '00000000-0000-0000-0000-000000000000'::UUID), lebar);


-- ============================================================
-- 6. PRODUK
-- ============================================================
-- gambar_url selalu di atas (prioritas utama)
-- kode_produk auto-generate: RAK + KAT_INITIAL + DDMMYY + MOTIF_INITIAL + DETIK
-- stok = jumlah gulungan aktif (auto-update via trigger)
-- terjual = total meter terjual (auto-update via trigger)
-- status = ready/sold (auto berdasarkan stok)
-- jenis_pewarna ada di sini (gulungan inherit, tidak duplikasi)
--
-- Tampilan: card 4 kolom
-- Di card ada tombol: beli, pre order reguler, detail produk
-- ============================================================
CREATE TABLE produk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gambar_url TEXT,
  kode_produk VARCHAR(50) UNIQUE,
  kategori_id UUID NOT NULL REFERENCES kategori(id) ON DELETE RESTRICT,
  motif_id UUID NOT NULL REFERENCES motif(id) ON DELETE RESTRICT,
  rak_id UUID NOT NULL REFERENCES rak(id) ON DELETE RESTRICT,
  jenis_pewarna VARCHAR(10) NOT NULL CHECK (jenis_pewarna IN ('sintetis', 'alami')),
  stok INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(10) DEFAULT 'ready' CHECK (status IN ('ready', 'sold')),
  terjual DECIMAL(10,2) NOT NULL DEFAULT 0,
  tanggal_ditambahkan TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_produk_kategori ON produk(kategori_id);
CREATE INDEX idx_produk_motif ON produk(motif_id);
CREATE INDEX idx_produk_rak ON produk(rak_id);
CREATE INDEX idx_produk_status ON produk(status);
CREATE INDEX idx_produk_terjual ON produk(terjual DESC);


-- ============================================================
-- 7. GULUNGAN
-- ============================================================
-- nomor_gulungan: urutan dalam produk (1, 2, 3, ...)
-- jenis_pewarna TIDAK disimpan di sini (inherit dari produk)
-- lebar & harga_per_meter: snapshot dari daftar_harga saat dibuat
-- panjang_total: panjang awal saat gulungan ditambahkan
-- panjang_sisa: sisa setelah dipotong order
-- is_active: FALSE jika panjang_sisa <= 0
--
-- Tampilan: card dalam detail produk
-- Method: tambah dari card produk (gulungan pertama),
--         tambah dalam card gulungan (gulungan berikutnya),
--         edit, hapus
-- ============================================================
CREATE TABLE gulungan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produk_id UUID NOT NULL REFERENCES produk(id) ON DELETE RESTRICT,
  nomor_gulungan INTEGER NOT NULL,
  lebar INTEGER NOT NULL CHECK (lebar IN (70, 110)),
  panjang_total DECIMAL(10,2) NOT NULL CHECK (panjang_total > 0),
  panjang_sisa DECIMAL(10,2) NOT NULL CHECK (panjang_sisa >= 0),
  harga_per_meter DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produk_id, nomor_gulungan)
);

CREATE INDEX idx_gulungan_produk ON gulungan(produk_id);
CREATE INDEX idx_gulungan_lebar ON gulungan(lebar);
CREATE INDEX idx_gulungan_active ON gulungan(is_active);


-- ============================================================
-- 8. ORDERS
-- ============================================================
-- nomor_order auto-generate: ORD-YYYYMMDD-XXX
-- tanpa data pelanggan (langsung jual di toko)
-- metode_pembayaran: cash / transfer (dropdown)
-- diskon: persentase (misal input 20 = 20%)
--
-- Digunakan: riwayat order, keranjang, grafik, laporan
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  nomor_order VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
  tanggal_order TIMESTAMPTZ DEFAULT NOW(),
  metode_pembayaran VARCHAR(10) NOT NULL DEFAULT 'cash'
    CHECK (metode_pembayaran IN ('cash', 'transfer')),
  diskon DECIMAL(5,2) NOT NULL DEFAULT 0
    CHECK (diskon >= 0 AND diskon <= 100),
  total_harga DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_tanggal ON orders(tanggal_order);


-- ============================================================
-- 9. ITEM ORDER
-- ============================================================
-- Detail item dalam keranjang/order
-- Alur: CS pilih card produk → pilih gulungan → input panjang
-- gulungan_id: gulungan mana yang dipotong
-- jumlah_order: panjang yang dipotong (meter)
-- harga_per_meter: snapshot harga saat transaksi
-- subtotal: jumlah_order * harga_per_meter
-- ============================================================
CREATE TABLE item_order (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gulungan_id UUID NOT NULL REFERENCES gulungan(id) ON DELETE RESTRICT,
  jumlah_order DECIMAL(10,2) NOT NULL CHECK (jumlah_order > 0),
  harga_per_meter DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_item_order_order ON item_order(order_id);
CREATE INDEX idx_item_order_gulungan ON item_order(gulungan_id);


-- ============================================================
-- 10. PRE ORDER REGULER (Header)
-- ============================================================
-- nomor_po auto-generate: POR-YYYYMMDD-XXX
--
-- ALUR:
--   1. User klik tombol "Tambah PO Reguler"
--   2. Muncul form: nama_customer, kontak, alamat (opsional)
--   3. Di dalam form ada tombol "Tambah Pre Order"
--   4. Diarahkan ke menu Order (card produk + tombol PO reguler)
--   5. Pilih produk → masuk ke list di form
--   6. Di list: pilih lebar (70/110), input panjang, input jumlah
--   7. Bisa ulangi step 3-6 untuk tambah item lagi
--   8. Isi metode pembayaran, status pembayaran (DP/Lunas), total DP, diskon
--   9. Submit
--
-- status: belum_diproses / sedang_diproses / selesai
-- metode_pembayaran: cash / transfer (dropdown)
-- status_pembayaran: dp / lunas
-- ============================================================
CREATE TABLE pre_order_reguler (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_po VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  nama_customer VARCHAR(255) NOT NULL,
  kontak_customer VARCHAR(20),
  alamat_customer TEXT,
  tanggal_selesai DATE,
  status VARCHAR(20) DEFAULT 'belum_diproses'
    CHECK (status IN ('belum_diproses', 'sedang_diproses', 'selesai')),
  metode_pembayaran VARCHAR(10) NOT NULL DEFAULT 'cash'
    CHECK (metode_pembayaran IN ('cash', 'transfer')),
  status_pembayaran VARCHAR(10) DEFAULT 'dp'
    CHECK (status_pembayaran IN ('dp', 'lunas')),
  total_dp DECIMAL(12,2) NOT NULL DEFAULT 0,
  diskon DECIMAL(5,2) NOT NULL DEFAULT 0
    CHECK (diskon >= 0 AND diskon <= 100),
  total_harga DECIMAL(12,2) NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_por_status ON pre_order_reguler(status);
CREATE INDEX idx_por_pembayaran ON pre_order_reguler(status_pembayaran);
CREATE INDEX idx_por_created_by ON pre_order_reguler(created_by);


-- ============================================================
-- 11. ITEM PRE ORDER REGULER (Detail)
-- ============================================================
-- Detail item dalam satu PO reguler
-- produk_id: produk dari katalog yang di-reorder
-- lebar: 70 / 110 (dipilih saat input)
-- panjang: panjang per item (meter)
-- jumlah: qty item (misal 3 gulungan)
-- harga_per_meter: otomatis dari daftar_harga
-- subtotal: panjang * jumlah * harga_per_meter
-- ============================================================
CREATE TABLE item_pre_order_reguler (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pre_order_reguler_id UUID NOT NULL REFERENCES pre_order_reguler(id) ON DELETE CASCADE,
  produk_id UUID NOT NULL REFERENCES produk(id) ON DELETE RESTRICT,
  lebar INTEGER NOT NULL CHECK (lebar IN (70, 110)),
  panjang DECIMAL(10,2) NOT NULL CHECK (panjang > 0),
  jumlah INTEGER NOT NULL DEFAULT 1 CHECK (jumlah > 0),
  harga_per_meter DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ipor_po ON item_pre_order_reguler(pre_order_reguler_id);
CREATE INDEX idx_ipor_produk ON item_pre_order_reguler(produk_id);


-- ============================================================
-- 12. PRE ORDER CUSTOM (Flat form / tanpa items)
-- ============================================================
-- nomor_po auto-generate: POC-YYYYMMDD-XXX
-- Form biasa (tambah langsung semua field)
-- total_harga: input manual (karena desain custom)
-- gambar_custom: upload desain dari customer
-- metode_pembayaran: cash / transfer (dropdown)
-- status_pembayaran: dp / lunas
--
-- Digunakan: riwayat PO custom, grafik, laporan
-- ============================================================
CREATE TABLE pre_order_custom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomor_po VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  gambar_custom TEXT,
  nama_customer VARCHAR(255) NOT NULL,
  kontak_customer VARCHAR(20),
  alamat_customer TEXT,
  tanggal_selesai DATE,
  status VARCHAR(20) DEFAULT 'belum_diproses'
    CHECK (status IN ('belum_diproses', 'sedang_diproses', 'selesai')),
  metode_pembayaran VARCHAR(10) NOT NULL DEFAULT 'cash'
    CHECK (metode_pembayaran IN ('cash', 'transfer')),
  status_pembayaran VARCHAR(10) DEFAULT 'dp'
    CHECK (status_pembayaran IN ('dp', 'lunas')),
  total_dp DECIMAL(12,2) NOT NULL DEFAULT 0,
  diskon DECIMAL(5,2) NOT NULL DEFAULT 0
    CHECK (diskon >= 0 AND diskon <= 100),
  total_harga DECIMAL(12,2) NOT NULL DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_poc_status ON pre_order_custom(status);
CREATE INDEX idx_poc_pembayaran ON pre_order_custom(status_pembayaran);
CREATE INDEX idx_poc_created_by ON pre_order_custom(created_by);


-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- A. Auto-generate nomor order: ORD-YYYYMMDD-XXX
-- ============================================================
CREATE OR REPLACE FUNCTION generate_nomor_order()
RETURNS TRIGGER AS $$
DECLARE
  today_date TEXT;
  seq INTEGER;
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq
  FROM orders WHERE TO_CHAR(tanggal_order, 'YYYYMMDD') = today_date;
  NEW.nomor_order := 'ORD-' || today_date || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nomor_order
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_nomor_order();

-- B. Auto-generate nomor PO reguler: POR-YYYYMMDD-XXX
-- ============================================================
CREATE OR REPLACE FUNCTION generate_nomor_por()
RETURNS TRIGGER AS $$
DECLARE
  today_date TEXT;
  seq INTEGER;
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq
  FROM pre_order_reguler WHERE TO_CHAR(created_at, 'YYYYMMDD') = today_date;
  NEW.nomor_po := 'POR-' || today_date || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nomor_por
  BEFORE INSERT ON pre_order_reguler
  FOR EACH ROW EXECUTE FUNCTION generate_nomor_por();

-- C. Auto-generate nomor PO custom: POC-YYYYMMDD-XXX
-- ============================================================
CREATE OR REPLACE FUNCTION generate_nomor_poc()
RETURNS TRIGGER AS $$
DECLARE
  today_date TEXT;
  seq INTEGER;
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq
  FROM pre_order_custom WHERE TO_CHAR(created_at, 'YYYYMMDD') = today_date;
  NEW.nomor_po := 'POC-' || today_date || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nomor_poc
  BEFORE INSERT ON pre_order_custom
  FOR EACH ROW EXECUTE FUNCTION generate_nomor_poc();

-- D. Auto-generate kode_produk
-- ============================================================
-- Format: RAK + KAT_INITIAL + DDMMYY + MOTIF_INITIAL + DETIK
-- Contoh: GA051226G20
-- ============================================================
CREATE OR REPLACE FUNCTION generate_kode_produk()
RETURNS TRIGGER AS $$
DECLARE
  v_rak CHAR(1);
  v_kat CHAR(1);
  v_mot CHAR(1);
  v_date TEXT;
  v_detik TEXT;
BEGIN
  SELECT LEFT(nama_rak, 1) INTO v_rak FROM rak WHERE id = NEW.rak_id;
  SELECT LEFT(nama_kategori, 1) INTO v_kat FROM kategori WHERE id = NEW.kategori_id;
  SELECT LEFT(nama_motif, 1) INTO v_mot FROM motif WHERE id = NEW.motif_id;
  v_date := TO_CHAR(NOW(), 'DDMMYY');
  v_detik := TO_CHAR(NOW(), 'SS');
  NEW.kode_produk := UPPER(v_rak || v_kat || v_date || v_mot || v_detik);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kode_produk
  BEFORE INSERT ON produk
  FOR EACH ROW
  WHEN (NEW.kode_produk IS NULL)
  EXECUTE FUNCTION generate_kode_produk();

-- E. Update gulungan setelah order (potong panjang)
-- ============================================================
CREATE OR REPLACE FUNCTION update_gulungan_after_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gulungan
  SET
    panjang_sisa = panjang_sisa - NEW.jumlah_order,
    is_active = CASE
      WHEN (panjang_sisa - NEW.jumlah_order) <= 0 THEN FALSE
      ELSE TRUE
    END,
    updated_at = NOW()
  WHERE id = NEW.gulungan_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_potong_gulungan
  AFTER INSERT ON item_order
  FOR EACH ROW EXECUTE FUNCTION update_gulungan_after_order();

-- F. Auto-update stok & status produk
-- ============================================================
-- stok = jumlah gulungan aktif
-- status = sold jika stok = 0
-- ============================================================
CREATE OR REPLACE FUNCTION update_produk_stok()
RETURNS TRIGGER AS $$
DECLARE
  v_stok INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_stok
  FROM gulungan
  WHERE produk_id = NEW.produk_id AND is_active = TRUE;

  UPDATE produk
  SET
    stok = v_stok,
    status = CASE WHEN v_stok = 0 THEN 'sold' ELSE 'ready' END,
    updated_at = NOW()
  WHERE id = NEW.produk_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stok
  AFTER INSERT OR UPDATE OF is_active OR DELETE ON gulungan
  FOR EACH ROW EXECUTE FUNCTION update_produk_stok();

-- G. Auto-update produk.terjual setelah order
-- ============================================================
-- terjual = total meter yang sudah terjual dari semua order
-- ============================================================
CREATE OR REPLACE FUNCTION update_produk_terjual()
RETURNS TRIGGER AS $$
DECLARE
  v_produk_id UUID;
  v_total_terjual DECIMAL;
BEGIN
  SELECT g.produk_id INTO v_produk_id
  FROM gulungan g WHERE g.id = NEW.gulungan_id;

  SELECT COALESCE(SUM(io.jumlah_order), 0) INTO v_total_terjual
  FROM item_order io
  JOIN gulungan g ON g.id = io.gulungan_id
  WHERE g.produk_id = v_produk_id;

  UPDATE produk
  SET terjual = v_total_terjual, updated_at = NOW()
  WHERE id = v_produk_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_terjual
  AFTER INSERT ON item_order
  FOR EACH ROW EXECUTE FUNCTION update_produk_terjual();

-- H. Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON kategori FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON motif FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON rak FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON daftar_harga FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON produk FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON gulungan FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pre_order_reguler FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON pre_order_custom FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- HELPER FUNCTION: Get harga per meter
-- ============================================================
CREATE OR REPLACE FUNCTION get_harga_per_meter(
  p_jenis_pewarna VARCHAR,
  p_motif_id UUID,
  p_lebar INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
  v_harga DECIMAL;
BEGIN
  -- Cek harga khusus motif dulu
  SELECT harga_per_meter INTO v_harga
  FROM daftar_harga
  WHERE jenis_pewarna = p_jenis_pewarna
    AND motif_id = p_motif_id
    AND lebar = p_lebar;

  -- Fallback ke harga umum
  IF v_harga IS NULL THEN
    SELECT harga_per_meter INTO v_harga
    FROM daftar_harga
    WHERE jenis_pewarna = p_jenis_pewarna
      AND motif_id IS NULL
      AND lebar = p_lebar;
  END IF;

  RETURN COALESCE(v_harga, 0);
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE motif ENABLE ROW LEVEL SECURITY;
ALTER TABLE rak ENABLE ROW LEVEL SECURITY;
ALTER TABLE daftar_harga ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE gulungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_order_reguler ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_pre_order_reguler ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_order_custom ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_owner" ON profiles FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'owner');
CREATE POLICY "profiles_delete_owner" ON profiles FOR DELETE TO authenticated
  USING (get_user_role() = 'owner' AND id != auth.uid());

-- MASTER DATA
CREATE POLICY "kategori_select" ON kategori FOR SELECT TO authenticated USING (true);
CREATE POLICY "kategori_modify" ON kategori FOR ALL TO authenticated
  USING (get_user_role() IN ('kepala_produksi', 'owner'));
CREATE POLICY "motif_select" ON motif FOR SELECT TO authenticated USING (true);
CREATE POLICY "motif_modify" ON motif FOR ALL TO authenticated
  USING (get_user_role() IN ('kepala_produksi', 'owner'));
CREATE POLICY "rak_select" ON rak FOR SELECT TO authenticated USING (true);
CREATE POLICY "rak_modify" ON rak FOR ALL TO authenticated
  USING (get_user_role() IN ('kepala_produksi', 'owner'));
CREATE POLICY "harga_select" ON daftar_harga FOR SELECT TO authenticated USING (true);
CREATE POLICY "harga_modify" ON daftar_harga FOR ALL TO authenticated
  USING (get_user_role() IN ('kepala_produksi', 'owner'));

-- PRODUK & GULUNGAN
CREATE POLICY "produk_select" ON produk FOR SELECT TO authenticated USING (true);
CREATE POLICY "produk_modify" ON produk FOR ALL TO authenticated
  USING (get_user_role() IN ('kepala_produksi', 'owner'));
CREATE POLICY "gulungan_select" ON gulungan FOR SELECT TO authenticated USING (true);
CREATE POLICY "gulungan_modify" ON gulungan FOR ALL TO authenticated
  USING (get_user_role() IN ('kepala_produksi', 'owner'));

-- ORDERS
CREATE POLICY "orders_select" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'customer_service');
CREATE POLICY "item_order_select" ON item_order FOR SELECT TO authenticated USING (true);
CREATE POLICY "item_order_insert" ON item_order FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'customer_service');

-- PRE ORDER REGULER
CREATE POLICY "por_select" ON pre_order_reguler FOR SELECT TO authenticated USING (true);
CREATE POLICY "por_insert" ON pre_order_reguler FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('customer_service', 'kepala_produksi'));
CREATE POLICY "por_update" ON pre_order_reguler FOR UPDATE TO authenticated
  USING (get_user_role() IN ('kepala_produksi', 'owner'));
CREATE POLICY "ipor_select" ON item_pre_order_reguler FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipor_insert" ON item_pre_order_reguler FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('customer_service', 'kepala_produksi'));

-- PRE ORDER CUSTOM
CREATE POLICY "poc_select" ON pre_order_custom FOR SELECT TO authenticated USING (true);
CREATE POLICY "poc_insert" ON pre_order_custom FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('customer_service', 'kepala_produksi'));
CREATE POLICY "poc_update" ON pre_order_custom FOR UPDATE TO authenticated
  USING (get_user_role() IN ('kepala_produksi', 'owner'));


-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO kategori (id, nama_kategori) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Kain Lurik'),
  ('a1000000-0000-0000-0000-000000000002', 'Selendang');

INSERT INTO motif (id, nama_motif) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Blok Lurik'),
  ('b1000000-0000-0000-0000-000000000002', 'Lurik Salur'),
  ('b1000000-0000-0000-0000-000000000003', 'Lurik Pelangi'),
  ('b1000000-0000-0000-0000-000000000004', 'Lurik Tumbar Pecah');

INSERT INTO rak (id, nama_rak) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'A'),
  ('c1000000-0000-0000-0000-000000000002', 'B'),
  ('c1000000-0000-0000-0000-000000000003', 'C');

INSERT INTO daftar_harga (jenis_pewarna, motif_id, lebar, harga_per_meter) VALUES
  ('sintetis', NULL, 70, 38500.00),
  ('sintetis', NULL, 110, 57500.00),
  ('alami', NULL, 70, 46500.00),
  ('alami', NULL, 110, 67500.00),
  ('sintetis', 'b1000000-0000-0000-0000-000000000001', 110, 60000.00);


-- ============================================================
-- VIEWS untuk Dashboard, Grafik & Laporan
-- ============================================================

-- Dashboard: summary counts
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM produk WHERE status = 'ready') AS produk_tersedia,
  (SELECT COUNT(*) FROM produk WHERE status = 'sold') AS produk_sold,
  (SELECT COUNT(*) FROM pre_order_reguler WHERE status = 'sedang_diproses')
    + (SELECT COUNT(*) FROM pre_order_custom WHERE status = 'sedang_diproses') AS sedang_diproses,
  (SELECT COUNT(*) FROM pre_order_reguler WHERE status = 'belum_diproses')
    + (SELECT COUNT(*) FROM pre_order_custom WHERE status = 'belum_diproses') AS belum_diproses;

-- Dashboard: produk terlaris (dari field terjual)
CREATE OR REPLACE VIEW v_produk_terlaris AS
SELECT
  p.id,
  p.gambar_url,
  p.kode_produk,
  k.nama_kategori,
  m.nama_motif,
  r.nama_rak,
  p.jenis_pewarna,
  p.stok,
  p.terjual,
  p.status
FROM produk p
JOIN kategori k ON k.id = p.kategori_id
JOIN motif m ON m.id = p.motif_id
JOIN rak r ON r.id = p.rak_id
ORDER BY p.terjual DESC;

-- Rekap stok gulungan per lebar
CREATE OR REPLACE VIEW v_rekap_gulungan AS
SELECT
  g.lebar,
  COUNT(*) AS total_gulungan,
  COUNT(*) FILTER (WHERE g.is_active = TRUE) AS gulungan_aktif,
  COUNT(*) FILTER (WHERE g.is_active = FALSE) AS gulungan_habis,
  COALESCE(SUM(g.panjang_sisa) FILTER (WHERE g.is_active = TRUE), 0) AS total_sisa_meter
FROM gulungan g
GROUP BY g.lebar
ORDER BY g.lebar;

-- Grafik pendapatan bulanan (3 line: order, PO reguler, PO custom)
CREATE OR REPLACE VIEW v_pendapatan_bulanan AS
SELECT
  tahun_bulan,
  sumber,
  SUM(total) AS total_pendapatan
FROM (
  SELECT TO_CHAR(o.tanggal_order, 'YYYY-MM') AS tahun_bulan,
    'order' AS sumber, o.total_harga AS total
  FROM orders o
  UNION ALL
  SELECT TO_CHAR(por.updated_at, 'YYYY-MM') AS tahun_bulan,
    'pre_order_reguler' AS sumber, por.total_harga AS total
  FROM pre_order_reguler por WHERE por.status = 'selesai'
  UNION ALL
  SELECT TO_CHAR(poc.updated_at, 'YYYY-MM') AS tahun_bulan,
    'pre_order_custom' AS sumber, poc.total_harga AS total
  FROM pre_order_custom poc WHERE poc.status = 'selesai'
) combined
GROUP BY tahun_bulan, sumber
ORDER BY tahun_bulan, sumber;
