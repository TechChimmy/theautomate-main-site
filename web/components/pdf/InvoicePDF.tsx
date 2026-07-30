import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  taxInvoiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  invoiceDetailsGrid: {
    flexDirection: 'row',
  },
  billToCol: {
    width: '50%',
  },
  detailsCol: {
    width: '50%',
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  mb4: {
    marginBottom: 4,
  },
  mb8: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E90FF',
    color: '#fff',
    padding: 8,
    marginTop: 20,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colNo: { width: '5%' },
  colItem: { width: '55%' },
  colHsn: { width: '20%', textAlign: 'center' },
  colAmount: { width: '20%', textAlign: 'right' },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  totalsValue: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    minWidth: 80,
    textAlign: 'right',
  },
  bankDetailsRow: {
    flexDirection: 'row',
    marginTop: 50,
  },
  bankCol: {
    width: '50%',
  },
  signCol: {
    width: '50%',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  termsSection: {
    marginTop: 50,
  },
  greyText: {
    color: '#666',
  }
});

interface InvoicePDFProps {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientPhone: string;
  itemName: string;
  amount: number;
}

const numberToWords = (num: number): string => {
  return "Rupees " + num.toString() + " Only"; 
}

export const InvoicePDF = ({
  invoiceNumber,
  date,
  clientName,
  clientPhone,
  itemName,
  amount,
}: InvoicePDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={{ fontSize: 24, color: '#1E90FF', fontWeight: 'bold', fontFamily: 'Helvetica-Bold' }}>Auto-Mate</Text>
        </View>

        <View style={styles.line} />

        <View style={styles.titleRow}>
          <Text style={styles.taxInvoiceTitle}>TAX INVOICE</Text>
        </View>

        <View style={styles.invoiceDetailsGrid}>
          {/* Bill To */}
          <View style={styles.billToCol}>
            <Text style={[styles.bold, styles.mb4, { fontSize: 12 }]}>Bill To:</Text>
            <Text style={styles.mb4}>{clientName}</Text>
            <Text>Phone: {clientPhone}</Text>
          </View>
          {/* Details */}
          <View style={styles.detailsCol}>
            <Text style={styles.mb4}>Invoice #: {invoiceNumber}</Text>
            <Text style={styles.mb4}>Invoice Date: {date}</Text>
            <Text style={styles.mb4}>Due Date: {date}</Text>
            <Text>Place of Supply: Online (Digital Delivery)</Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.colNo}>#</Text>
          <Text style={styles.colItem}>Item</Text>
          <Text style={styles.colHsn}>HSN/SAC</Text>
          <Text style={styles.colAmount}>Amount</Text>
        </View>

        {/* Table Row */}
        <View style={styles.tableRow}>
          <Text style={styles.colNo}>1</Text>
          <View style={styles.colItem}>
            <Text style={[styles.bold, styles.mb4]}>{itemName}</Text>
            <Text style={styles.greyText}>Online course / digital access</Text>
          </View>
          <Text style={styles.colHsn}>999293</Text>
          <Text style={styles.colAmount}>Rs {amount}</Text>
        </View>

        {/* Totals */}
        <View style={[styles.totalsRow, { marginTop: 10, justifyContent: 'flex-end' }]}>
           <Text style={{ width: 120, textAlign: 'right', paddingRight: 10 }}>Taxable Amount:</Text>
           <Text style={{ width: 80, textAlign: 'right', borderBottomWidth: 1 }}>Rs {amount}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
          <Text style={styles.greyText}>Total Items / Qty: 1 / 1</Text>
          <View style={{ width: 220 }}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
               <Text style={[styles.bold, { fontSize: 14 }]}>Total:</Text>
               <Text style={[styles.totalsValue, { fontSize: 14 }]}>Rs {amount}</Text>
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
               <Text>Total amount in words:</Text>
               <Text style={[styles.bold, { borderBottomWidth: 1, paddingBottom: 2}]}>{numberToWords(amount)}</Text>
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
               <Text style={styles.bold}>Amount Payable:</Text>
               <Text style={[styles.totalsValue]}>Rs {amount}</Text>
             </View>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.bankDetailsRow}>
           <View style={styles.bankCol}>
             <Text style={[styles.bold, styles.mb4]}>Bank Details:</Text>
             <Text style={styles.mb4}>Bank: HDFC</Text>
             <Text style={styles.mb4}>Account Holder: Vinoth Vasu</Text>
             <Text style={styles.mb4}>Account #: 24051130010079</Text>
             <Text style={styles.mb4}>IFSC Code: HDFC0002405</Text>
             <Text>Branch: Olympia tech park, Guindy</Text>
           </View>
           <View style={styles.signCol}>
             <Text style={[styles.bold, styles.mb4]}>For Auto-Mate</Text>
             <Text style={[styles.greyText, { marginTop: 40 }]}>Authorized Signatory</Text>
           </View>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
           <Text style={[styles.bold, styles.mb4]}>Notes:</Text>
           <Text style={[styles.greyText, styles.mb8]}>Thank you for your business.</Text>

           <Text style={[styles.bold, styles.mb4]}>Terms and Conditions:</Text>
           <Text style={styles.greyText}>1. All purchases are final.</Text>
           <Text style={styles.greyText}>2. Access is granted immediately upon successful payment.</Text>
        </View>
      </Page>
    </Document>
  );
};
