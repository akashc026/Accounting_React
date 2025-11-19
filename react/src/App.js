import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Layout/Header';
import DrawerComponent from './components/Layout/Drawer';
import { SalesForm, SalesOrderForm, ItemFulfillmentForm, InvoiceForm, SalesOrderList, ItemFulfillmentList, InvoiceList, CreditMemoList, DebitMemoList } from './components/Sales';
import { PurchaseOrderForm, ItemReceiptForm, VendorBillForm, PurchaseOrderList, ItemReceiptList, VendorBillList, VendorCreditList } from './components/Purchases';
import { PurchaseForm } from './components/Purchases';
import {
  CustomerList,
  VendorList,
  CustomerForm,
  VendorForm,
  ChartOfAccountList,
  ChartOfAccountForm,
  LocationList,
  LocationForm,
  ProductList,
  ProductForm,
  TaxList,
  TaxForm
} from './components/MasterData';
import {
  FormList,
  FormCreator
} from './components/Forms';
import { InventoryForm, InventoryAdjustmentList, InventoryTransferList } from './components/Inventory';
import { CustomerPaymentForm, VendorPaymentForm, CustomerPaymentList, VendorPaymentList } from './components/Payment';
import { JournalEntryForm, JournalEntryList } from './components/Journal';
import '@progress/kendo-theme-default/dist/all.css';
import ChartContainer from './components/Charts/charts';
import ChartOfAccounts from './components/Reports/ChartOfAccounts';

function App() {
  const [expanded, setExpanded] = useState(false);

  const handleMenuClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Router>
      <div className="app-container">
        <Header onMenuClick={handleMenuClick} expanded={expanded} />
        <div className="app-body">
          <DrawerComponent 
            expanded={expanded}
            setExpanded={setExpanded}
          />
          <div className="content">
            <Routes>
              <Route path="/" element={ <ChartContainer/>} />
              
              {/* Forms Routes */}
              <Route path="/forms" element={<FormList />} />
              <Route path="/forms/new" element={<FormCreator />} />
              <Route path="/forms/view/:id" element={<FormCreator mode="view" />} />
              <Route path="/forms/edit/:id" element={<FormCreator mode="edit" />} />
              
              {/* Inventory Routes */}
              <Route path="/inventory-adjustment" element={<InventoryAdjustmentList />} />
              <Route path="/inventory-adjustment/new" element={<InventoryForm recordType="InventoryAdjustment" />} />
              <Route path="/inventory-adjustment/view/:id" element={<InventoryForm recordType="InventoryAdjustment" mode="view" />} />
              <Route path="/inventory-adjustment/edit/:id" element={<InventoryForm recordType="InventoryAdjustment" mode="edit" />} />
              
              <Route path="/inventory-transfer" element={<InventoryTransferList />} />
              <Route path="/inventory-transfer/new" element={<InventoryForm recordType="InventoryTransfer" />} />
              <Route path="/inventory-transfer/view/:id" element={<InventoryForm recordType="InventoryTransfer" mode="view" />} />
              <Route path="/inventory-transfer/edit/:id" element={<InventoryForm recordType="InventoryTransfer" mode="edit" />} />
              
              {/* Transaction Routes */}
              <Route path="/Sales" element={<Navigate to="/sales-order" replace />} />
              
              {/* Sales Order Routes */}
              <Route path="/sales-order" element={<SalesOrderList />} />
              <Route path="/sales-order/new" element={<SalesOrderForm />} />
              <Route path="/sales-order/view/:id" element={<SalesOrderForm mode="view" />} />
              <Route path="/sales-order/edit/:id" element={<SalesOrderForm mode="edit" />} />
              
              {/* Item Fulfillment Routes */}
              <Route path="/item-fulfillment" element={<ItemFulfillmentList />} />
              <Route path="/item-fulfillment/new" element={<ItemFulfillmentForm />} />
              <Route path="/item-fulfillment/view/:id" element={<ItemFulfillmentForm mode="view" />} />
              <Route path="/item-fulfillment/edit/:id" element={<ItemFulfillmentForm mode="edit" />} />
              
              {/* Invoice Routes */}
              <Route path="/invoice" element={<InvoiceList />} />
              <Route path="/invoice/new" element={<InvoiceForm />} />
              <Route path="/invoice/view/:id" element={<InvoiceForm mode="view" />} />
              <Route path="/invoice/edit/:id" element={<InvoiceForm mode="edit" />} />
              
              {/* Credit Memo Routes */}
              <Route path="/credit-memo" element={<CreditMemoList />} />
              <Route path="/credit-memo/new" element={<SalesForm recordType="CreditMemo" />} />
              <Route path="/credit-memo/view/:id" element={<SalesForm recordType="CreditMemo" mode="view" />} />
              <Route path="/credit-memo/edit/:id" element={<SalesForm recordType="CreditMemo" mode="edit" />} />
              
              {/* Debit Memo Routes */}
              <Route path="/debit-memo" element={<DebitMemoList />} />
              <Route path="/debit-memo/new" element={<SalesForm recordType="DebitMemo" />} />
              <Route path="/debit-memo/view/:id" element={<SalesForm recordType="DebitMemo" mode="view" />} />
              <Route path="/debit-memo/edit/:id" element={<SalesForm recordType="DebitMemo" mode="edit" />} />
              
              {/* Customer Payment Routes */}
              <Route path="/customer-payment" element={<CustomerPaymentList />} />
              <Route path="/customer-payment/new" element={<CustomerPaymentForm />} />
              <Route path="/customer-payment/view/:id" element={<CustomerPaymentForm mode="view" />} />
              <Route path="/customer-payment/edit/:id" element={<CustomerPaymentForm mode="edit" />} />
              
              {/* Journal Entry Routes */}
              <Route path="/journal-entry" element={<JournalEntryList />} />
              <Route path="/journal-entry/new" element={<JournalEntryForm />} />
              <Route path="/journal-entry/view/:id" element={<JournalEntryForm mode="view" />} />
              <Route path="/journal-entry/edit/:id" element={<JournalEntryForm mode="edit" />} />
              
              {/* Customer Routes */}
              <Route path="/customer" element={<CustomerList />} />
              <Route path="/customer/new" element={<CustomerForm />} />
              <Route path="/customer/view/:id" element={<CustomerForm mode="view" />} />
              <Route path="/customer/edit/:id" element={<CustomerForm mode="edit" />} />
              
              {/* Vendor Routes */}
              <Route path="/vendor" element={<VendorList />} />
              <Route path="/vendor/new" element={<VendorForm />} />
              <Route path="/vendor/view/:id" element={<VendorForm mode="view" />} />
              <Route path="/vendor/edit/:id" element={<VendorForm mode="edit" />} />
              
              {/* Chart of Accounts Routes */}
              <Route path="/chart-of-account" element={<ChartOfAccountList />} />
              <Route path="/chart-of-account/new" element={<ChartOfAccountForm />} />
              <Route path="/chart-of-account/view/:id" element={<ChartOfAccountForm mode="view" />} />
              <Route path="/chart-of-account/edit/:id" element={<ChartOfAccountForm mode="edit" />} />
              
              {/* Location Routes */}
              <Route path="/location" element={<LocationList />} />
              <Route path="/location/new" element={<LocationForm />} />
              <Route path="/location/view/:id" element={<LocationForm mode="view" />} />
              <Route path="/location/edit/:id" element={<LocationForm mode="edit" />} />
              
              {/* Product Routes */}
              <Route path="/product" element={<ProductList />} />
              <Route path="/product/new" element={<ProductForm />} />
              <Route path="/product/view/:id" element={<ProductForm mode="view" />} />
              <Route path="/product/edit/:id" element={<ProductForm mode="edit" />} />
              
              {/* Tax Routes */}
              <Route path="/tax" element={<TaxList />} />
              <Route path="/tax/new" element={<TaxForm />} />
              <Route path="/tax/view/:id" element={<TaxForm mode="view" />} />
              <Route path="/tax/edit/:id" element={<TaxForm mode="edit" />} />
              
              {/* Purchases Routes */}
              <Route path="/purchases" element={<Navigate to="/purchase-order" replace />} />
              
              {/* Purchase Order Routes */}
              <Route path="/purchase-order" element={<PurchaseOrderList />} />
              <Route path="/purchase-order/new" element={<PurchaseOrderForm />} />
              <Route path="/purchase-order/view/:id" element={<PurchaseOrderForm mode="view" />} />
              <Route path="/purchase-order/edit/:id" element={<PurchaseOrderForm mode="edit" />} />
              
              {/* Item Receipt Routes */}
              <Route path="/item-receipt" element={<ItemReceiptList />} />
              <Route path="/item-receipt/new" element={<ItemReceiptForm />} />
              <Route path="/item-receipt/view/:id" element={<ItemReceiptForm mode="view" />} />
              <Route path="/item-receipt/edit/:id" element={<ItemReceiptForm mode="edit" />} />
              
              {/* Vendor Bill Routes */}
              <Route path="/vendor-bill" element={<VendorBillList />} />
              <Route path="/vendor-bill/new" element={<VendorBillForm />} />
              <Route path="/vendor-bill/view/:id" element={<VendorBillForm mode="view" />} />
              <Route path="/vendor-bill/edit/:id" element={<VendorBillForm mode="edit" />} />
              
              {/* Vendor Credit Routes */}
              <Route path="/vendor-credit" element={<VendorCreditList />} />
              <Route path="/vendor-credit/new" element={<PurchaseForm recordType="VendorCredit" />} />
              <Route path="/vendor-credit/view/:id" element={<PurchaseForm recordType="VendorCredit" mode="view" />} />
              <Route path="/vendor-credit/edit/:id" element={<PurchaseForm recordType="VendorCredit" mode="edit" />} />
              
              {/* Vendor Payment Routes */}
              <Route path="/vendor-payment" element={<VendorPaymentList />} />
              <Route path="/vendor-payment/new" element={<VendorPaymentForm />} />
              <Route path="/vendor-payment/view/:id" element={<VendorPaymentForm mode="view" />} />
              <Route path="/vendor-payment/edit/:id" element={<VendorPaymentForm mode="edit" />} />
              <Route path="/reports" element={<Navigate to="/charts" replace />} />
              <Route path="/charts" element={ <ChartContainer/>} />
              <Route path="/coa-relation" element={<ChartOfAccounts />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
