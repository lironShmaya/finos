import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function UploadMasleka({ onComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStatus({ type: '', message: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setStatus({ type: 'info', message: 'Uploading file...' });

      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setStatus({ type: 'info', message: 'Parsing Masleka report...' });

      // Extract pension data
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            provider: { type: 'string' },
            policy_number: { type: 'string' },
            value: { type: 'number' },
            date: { type: 'string' },
            deposits: { type: 'number' },
            returns: { type: 'number' },
            fees: { type: 'number' },
          }
        }
      });

      if (result.status === 'error') {
        setStatus({ type: 'error', message: result.details || 'Failed to parse file' });
        return;
      }

      setStatus({ type: 'success', message: 'Masleka report parsed successfully!' });
      
      if (onComplete) {
        onComplete(result.output);
      }

    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label>Upload Masleka Report (PDF/Excel)</Label>
          <p className="text-xs text-gray-500 mt-1">Upload your pension report from Masleka and we'll automatically extract the data</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
            />
          </div>
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>

        {status.message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            status.type === 'error' ? 'bg-red-50 text-red-700' :
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
            {status.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {status.type === 'info' && <FileText className="h-4 w-4" />}
            {status.message}
          </div>
        )}

        {file && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <FileText className="h-4 w-4" />
            {file.name}
          </div>
        )}
      </div>
    </Card>
  );
}