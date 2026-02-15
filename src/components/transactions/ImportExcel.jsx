import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, CheckCircle, X } from 'lucide-react';

const TARGET_FIELDS = ['date', 'amount', 'type', 'category_name', 'merchant', 'description', 'currency', 'account_name', 'person_name', 'skip'];

export default function ImportExcel({ onImportComplete, onCancel }) {
  const [step, setStep] = useState('upload'); // upload | mapping | importing | done
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = async () => {
    if (!file) return;
    setStep('mapping');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          columns: { type: "array", items: { type: "string" }, description: "List of column headers" },
          rows: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true
            },
            description: "First 5 rows as objects with column names as keys"
          }
        }
      }
    });
    setExtractedData(res.output);
    // Auto-guess mapping
    if (res.output?.columns) {
      const auto = {};
      res.output.columns.forEach(col => {
        const lower = col.toLowerCase();
        if (lower.includes('date')) auto[col] = 'date';
        else if (lower.includes('amount') || lower.includes('sum')) auto[col] = 'amount';
        else if (lower.includes('type')) auto[col] = 'type';
        else if (lower.includes('categ')) auto[col] = 'category_name';
        else if (lower.includes('merchant') || lower.includes('payee') || lower.includes('vendor')) auto[col] = 'merchant';
        else if (lower.includes('desc') || lower.includes('note')) auto[col] = 'description';
        else if (lower.includes('currency')) auto[col] = 'currency';
        else if (lower.includes('account')) auto[col] = 'account_name';
        else if (lower.includes('person')) auto[col] = 'person_name';
        else auto[col] = 'skip';
      });
      setColumnMapping(auto);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');
    const rows = extractedData?.rows || [];
    const mapped = rows.map(row => {
      const tx = { source: 'excel_import', status: 'cleared' };
      Object.entries(columnMapping).forEach(([col, field]) => {
        if (field !== 'skip' && row[col] != null) {
          tx[field] = field === 'amount' ? parseFloat(row[col]) : String(row[col]);
        }
      });
      if (!tx.type) tx.type = (tx.amount || 0) >= 0 ? 'income' : 'expense';
      return tx;
    });

    const valid = mapped.filter(t => t.date && t.amount);
    if (valid.length > 0) {
      await base44.entities.Transaction.bulkCreate(valid);
    }
    setResult({ imported: valid.length, skipped: mapped.length - valid.length });
    setStep('done');
    setImporting(false);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900">Import from Excel</h3>
        <button onClick={onCancel}><X className="h-5 w-5 text-gray-400" /></button>
      </div>

      {step === 'upload' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">Upload your Excel or CSV file</p>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="max-w-xs mx-auto"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleFileUpload} disabled={!file}>
              Upload & Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'mapping' && !extractedData && (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Analyzing file...</span>
        </div>
      )}

      {step === 'mapping' && extractedData?.columns && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Map your file columns to transaction fields:</p>
          <div className="grid gap-3">
            {extractedData.columns.map(col => (
              <div key={col} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-40 truncate">{col}</span>
                <Select value={columnMapping[col] || 'skip'} onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [col]: v }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_FIELDS.map(f => (
                      <SelectItem key={f} value={f}>{f === 'skip' ? '— Skip —' : f.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleImport}>Import {extractedData.rows?.length || 0} rows</Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Importing transactions...</span>
        </div>
      )}

      {step === 'done' && result && (
        <div className="text-center py-8 space-y-3">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
          <p className="text-base font-medium text-gray-900">Import Complete!</p>
          <p className="text-sm text-gray-500">{result.imported} transactions imported, {result.skipped} skipped</p>
          <Button onClick={() => { onImportComplete(); }}>Done</Button>
        </div>
      )}
    </div>
  );
}