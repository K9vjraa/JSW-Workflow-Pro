import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapLocationViewerProps {
    taskLocation?: { lat: number; lng: number } | null;
    workerLocation?: { lat: number; lng: number } | null;
    height?: string;
}

// Distance calculation using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
}

export default function MapLocationViewer({ taskLocation, workerLocation, height = '300px' }: MapLocationViewerProps) {
    if (!hasValidKey) {
        return (
            <div className="w-full bg-slate-800 border border-slate-700 rounded-xl flex flex-col items-center justify-center p-6 text-center" style={{ height }}>
                <h3 className="text-white font-semibold mb-2">Google Maps API Key Required</h3>
                <p className="text-sm text-slate-400 mb-4 max-w-sm">To view Geo-Tag verifications, please open AI Studio Settings, go to Secrets, and add your GOOGLE_MAPS_PLATFORM_KEY.</p>
                <div className="text-xs text-slate-500">
                    Task: {taskLocation ? `${taskLocation.lat}, ${taskLocation.lng}` : 'N/A'}<br/>
                    Worker: {workerLocation ? `${workerLocation.lat}, ${workerLocation.lng}` : 'N/A'}
                </div>
            </div>
        );
    }

    const defaultCenter = taskLocation || workerLocation || { lat: 37.42, lng: -122.08 };
    
    let distanceStatus = null;
    let distanceLabel = null;
    
    if (taskLocation && workerLocation) {
        const distanceObj = calculateDistance(taskLocation.lat, taskLocation.lng, workerLocation.lat, workerLocation.lng);
        const formatDist = distanceObj > 1000 ? `${(distanceObj / 1000).toFixed(2)} km` : `${Math.round(distanceObj)} m`;
        
        if (distanceObj <= 50) {
            distanceStatus = 'valid';
            distanceLabel = `Verified: Worker is ${formatDist} from task.`;
        } else if (distanceObj <= 200) {
            distanceStatus = 'warning';
            distanceLabel = `Warning: Worker is ${formatDist} away.`;
        } else {
            distanceStatus = 'invalid';
            distanceLabel = `Alert: Worker is ${formatDist} away from location.`;
        }
    }

    return (
        <div className="w-full h-full relative" style={{ height }}>
            {distanceLabel && (
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-center pointer-events-none">
                    <div className={`px-4 py-2 rounded-full shadow-lg font-bold text-sm bg-slate-900 border pointer-events-auto
                        ${distanceStatus === 'valid' ? 'border-emerald-500 text-emerald-400' : 
                          distanceStatus === 'warning' ? 'border-amber-500 text-amber-400' : 'border-red-500 text-red-400'}
                    `}>
                        {distanceLabel}
                    </div>
                </div>
            )}
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-700">
              <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                      defaultCenter={defaultCenter}
                      defaultZoom={workerLocation && taskLocation ? 14 : 12}
                      mapId="GEO_VERIFY_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{width: '100%', height: '100%'}}
                  >
                      {taskLocation && (
                          <AdvancedMarker position={taskLocation} title="Task Location">
                              <Pin background="#475569" glyphColor="#fff" borderColor="#334155" />
                          </AdvancedMarker>
                      )}
                      
                      {workerLocation && (
                          <AdvancedMarker position={workerLocation} title="Worker Location">
                              <Pin background={distanceStatus === 'invalid' ? '#ef4444' : '#10b981'} glyphColor="#fff" borderColor="#022c22" />
                          </AdvancedMarker>
                      )}
                  </Map>
              </APIProvider>
            </div>
        </div>
    );
}
