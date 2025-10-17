-- businesses: each tenant (business)
CREATE TABLE businesses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  address VARCHAR(255),
  tax_number VARCHAR(100),
  currency VARCHAR(10) DEFAULT 'KES',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- users: login accounts
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- store hashed password
  full_name VARCHAR(150),
  role ENUM('owner','staff','accountant') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- clients/customers
CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(150),
  address VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- products & services
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  sku VARCHAR(80),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'pc',
  is_service TINYINT(1) DEFAULT 0,
  stock_qty DECIMAL(12,3) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- jobs / work orders
CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  client_id INT,
  vehicle_no VARCHAR(80),
  description TEXT,
  status ENUM('open','in_progress','completed','invoiced') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- invoices
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  client_id INT,
  date DATE DEFAULT (CURRENT_DATE),
  due_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  status ENUM('draft','issued','paid','cancelled') DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- invoice line items
CREATE TABLE invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  item_id INT,
  description VARCHAR(255),
  qty DECIMAL(12,3) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  line_total DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- payments
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  business_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method ENUM('cash','mpesa','card','bank','other') DEFAULT 'cash',
  reference VARCHAR(150),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- expenses
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

