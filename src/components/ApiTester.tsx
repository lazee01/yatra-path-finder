import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TravelApiService } from '@/services/travelApiService';
import { toast } from '@/components/ui/use-toast';

interface ApiStatus {
  working: boolean;
  error?: string;
  lastChecked: number;
}

const ApiTester: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<Record<string, ApiStatus>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [summary, setSummary] = useState<{ total: number; working: number; failed: number } | null>(null);

  const testAllApis = async () => {
    setIsTesting(true);
    try {
      const results = await TravelApiService.testAllApis();
      setApiStatus(results);

      const statusSummary = TravelApiService.getApiStatusSummary();
      setSummary(statusSummary);

      toast({
        title: "API Test Complete",
        description: `${statusSummary.working}/${statusSummary.total} APIs working`,
      });
    } catch (error) {
      console.error('API test failed:', error);
      toast({
        title: "API Test Failed",
        description: "Failed to test APIs. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const resetCache = () => {
    TravelApiService.resetApiStatusCache();
    setApiStatus({});
    setSummary(null);
    toast({
      title: "Cache Reset",
      description: "API status cache has been reset",
    });
  };

  const getStatusBadge = (status: ApiStatus) => {
    if (status.working) {
      return <Badge variant="default" className="bg-green-500">✅ Working</Badge>;
    } else {
      return <Badge variant="destructive">❌ Failed</Badge>;
    }
  };

  const formatLastChecked = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 API Diagnostics & Testing</CardTitle>
        <CardDescription>
          Test all external APIs and check their connectivity status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={testAllApis}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? '🔄 Testing APIs...' : '🧪 Test All APIs'}
          </Button>
          <Button
            onClick={resetCache}
            variant="outline"
          >
            🔄 Reset Cache
          </Button>
        </div>

        {summary && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">📊 Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                <div className="text-sm text-gray-600">Total APIs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.working}</div>
                <div className="text-sm text-gray-600">Working</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          </div>
        )}

        {Object.keys(apiStatus).length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">🔍 API Status Details</h3>
            {Object.entries(apiStatus).map(([apiName, status]) => (
              <div key={apiName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-medium capitalize">{apiName}</span>
                  {getStatusBadge(status)}
                </div>
                <div className="text-sm text-gray-600">
                  Last checked: {formatLastChecked(status.lastChecked)}
                  {status.error && (
                    <div className="text-red-600 text-xs mt-1">
                      Error: {status.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <strong>💡 Tips:</strong>
          <ul className="mt-1 space-y-1">
            <li>• APIs are tested every 5 minutes automatically</li>
            <li>• Failed APIs are skipped for 1 hour to improve performance</li>
            <li>• Check browser console for detailed API logs</li>
            <li>• Reset cache if you want to retest failed APIs immediately</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiTester;