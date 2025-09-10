import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

const DeployDebug: React.FC = () => {
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});
  const [apiTestResults, setApiTestResults] = useState<Record<string, any>>({});
  const [isTesting, setIsTesting] = useState(false);

  // Check environment variables
  const checkEnvironmentVariables = () => {
    const envVars = {
      'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY,
      'VITE_OPENTRIPMAP_API_KEY': import.meta.env.VITE_OPENTRIPMAP_API_KEY,
      'VITE_OPENCAGE_API_KEY': import.meta.env.VITE_OPENCAGE_API_KEY,
      'VITE_OPENWEATHER_API_KEY': import.meta.env.VITE_OPENWEATHER_API_KEY,
      'VITE_GEMINI_API_KEY': import.meta.env.VITE_GEMINI_API_KEY,
      'VITE_INDIAN_RAIL_API_KEY': import.meta.env.VITE_INDIAN_RAIL_API_KEY,
      'VITE_AMADEUS_API_KEY': import.meta.env.VITE_AMADEUS_API_KEY,
      'VITE_BOOKING_API_KEY': import.meta.env.VITE_BOOKING_API_KEY,
      'VITE_HUGGINGFACE_API_KEY': import.meta.env.VITE_HUGGINGFACE_API_KEY,
    };

    const status: Record<string, boolean> = {};
    Object.entries(envVars).forEach(([key, value]) => {
      status[key] = !!(value && value !== '' && !value.includes('your_') && !value.includes('demo'));
    });

    setEnvStatus(status);
    return status;
  };

  // Test basic API connectivity
  const testBasicConnectivity = async () => {
    setIsTesting(true);
    const results: Record<string, any> = {};

    try {
      // Test OpenTripMap
      const otmResponse = await fetch('https://api.opentripmap.com/0.1/en/places/radius?radius=1000&lon=0&lat=0&kinds=religion&format=json&apikey=demo');
      results.opentripmap = {
        status: otmResponse.status,
        ok: otmResponse.ok,
        error: otmResponse.ok ? null : `HTTP ${otmResponse.status}`
      };
    } catch (error: any) {
      results.opentripmap = {
        status: 'ERROR',
        ok: false,
        error: error.message
      };
    }

    try {
      // Test OpenCage
      const ocResponse = await fetch('https://api.opencagedata.com/geocode/v1/json?q=test&key=demo&limit=1');
      results.opencage = {
        status: ocResponse.status,
        ok: ocResponse.ok,
        error: ocResponse.ok ? null : `HTTP ${ocResponse.status}`
      };
    } catch (error: any) {
      results.opencage = {
        status: 'ERROR',
        ok: false,
        error: error.message
      };
    }

    try {
      // Test OpenWeather
      const owResponse = await fetch('https://api.openweathermap.org/data/2.5/weather?q=test&appid=demo');
      results.openweather = {
        status: owResponse.status,
        ok: owResponse.ok,
        error: owResponse.ok ? null : `HTTP ${owResponse.status}`
      };
    } catch (error: any) {
      results.openweather = {
        status: 'ERROR',
        ok: false,
        error: error.message
      };
    }

    setApiTestResults(results);
    setIsTesting(false);
  };

  useEffect(() => {
    checkEnvironmentVariables();
  }, []);

  const getEnvStatusBadge = (key: string, isValid: boolean) => {
    if (isValid) {
      return <Badge variant="default" className="bg-green-500">✅ Set</Badge>;
    } else {
      return <Badge variant="destructive">❌ Missing/Invalid</Badge>;
    }
  };

  const getApiStatusBadge = (result: any) => {
    if (result.ok) {
      return <Badge variant="default" className="bg-green-500">✅ Working</Badge>;
    } else {
      return <Badge variant="destructive">❌ Failed</Badge>;
    }
  };

  const envVarCount = Object.values(envStatus).filter(Boolean).length;
  const totalEnvVars = Object.keys(envStatus).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            🚀 Deployment Debug Tool
          </CardTitle>
          <CardDescription>
            Diagnose why search results are not showing in your deployed app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Variables Check */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Environment Variables Status
              <Badge variant="outline" className="ml-2">
                {envVarCount}/{totalEnvVars} Valid
              </Badge>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(envStatus).map(([key, isValid]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm font-mono">{key}</code>
                  {getEnvStatusBadge(key, isValid)}
                </div>
              ))}
            </div>

            {envVarCount < totalEnvVars && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Environment Variables Issue</AlertTitle>
                <AlertDescription>
                  Some environment variables are missing or invalid. This is the most common cause of search results not showing.
                  Make sure all VITE_ prefixed variables are set correctly in your Vercel dashboard.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* API Connectivity Test */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              API Connectivity Test
            </h3>

            <Button
              onClick={testBasicConnectivity}
              disabled={isTesting}
              className="mb-4"
            >
              {isTesting ? '🔄 Testing...' : '🧪 Test API Connectivity'}
            </Button>

            {Object.keys(apiTestResults).length > 0 && (
              <div className="space-y-3">
                {Object.entries(apiTestResults).map(([api, result]) => (
                  <div key={api} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium capitalize">{api}</span>
                      {getApiStatusBadge(result)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Status: {result.status}
                      {result.error && (
                        <div className="text-red-600 text-xs mt-1">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Troubleshooting Guide */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Troubleshooting Steps
            </h3>

            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Step 1: Check Vercel Environment Variables</AlertTitle>
                <AlertDescription>
                  Go to your Vercel dashboard → Project Settings → Environment Variables.
                  Ensure all VITE_ prefixed variables from your .env file are copied exactly.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Step 2: Redeploy After Environment Changes</AlertTitle>
                <AlertDescription>
                  After updating environment variables in Vercel, you must redeploy your app for changes to take effect.
                  Go to Deployments tab and trigger a new deployment.
                </AlertDescription>
              </Alert>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Step 3: Check API Keys Validity</AlertTitle>
                <AlertDescription>
                  Some API keys may be expired or have insufficient permissions. Try using the demo/test keys first to verify the integration works.
                </AlertDescription>
              </Alert>

              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertTitle>Step 4: Browser Console Debugging</AlertTitle>
                <AlertDescription>
                  Open browser developer tools (F12) and check the Console tab for detailed error messages from API calls.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Quick Fix Commands */}
          <div>
            <h3 className="text-lg font-semibold mb-4">⚡ Quick Fix Commands</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div className="space-y-2">
                <div># 1. Check current environment variables in Vercel</div>
                <div>vercel env ls</div>
                <div></div>
                <div># 2. Add missing environment variables</div>
                <div>vercel env add VITE_OPENTRIPMAP_API_KEY</div>
                <div>vercel env add VITE_GEMINI_API_KEY</div>
                <div></div>
                <div># 3. Redeploy the application</div>
                <div>vercel --prod</div>
                <div></div>
                <div># 4. Check deployment logs</div>
                <div>vercel logs</div>
              </div>
            </div>
          </div>

          {/* Success Indicators */}
          <div>
            <h3 className="text-lg font-semibold mb-4">🎯 Success Indicators</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Working Signs</span>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Hotels, temples, and attractions load</li>
                  <li>• AI insights generate successfully</li>
                  <li>• Transport options appear</li>
                  <li>• No console errors for API calls</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">Problem Signs</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Empty or loading states</li>
                  <li>• Same results for all destinations</li>
                  <li>• API errors in browser console</li>
                  <li>• Mock data appearing everywhere</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeployDebug;