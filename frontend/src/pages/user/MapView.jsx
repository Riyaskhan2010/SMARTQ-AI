import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Navigation, Clock, Car, ArrowLeft, ExternalLink } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { orgsAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { haversineDistance, estimateTravelTime } from '../../utils/helpers';

// Chennai centre as user's mock location
const USER_LAT  = 13.0523;
const USER_LNG  = 80.2307;

export default function MapView() {
  const { orgId } = useParams();
  const { t }     = useLanguage();
  const [org, setOrg]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orgsAPI.get(orgId).then(({ data }) => setOrg(data)).catch(() => {}).finally(() => setLoading(false));
  }, [orgId]);

  if (loading) return <div className="min-h-screen bg-navy-900"><Navbar /><LoadingSpinner text={t('loading')} /></div>;
  if (!org) return <div className="min-h-screen bg-navy-900"><Navbar /><p className="text-center text-slate-500 pt-20">Organization not found</p></div>;

  const dist    = haversineDistance(USER_LAT, USER_LNG, org.latitude, org.longitude);
  const travelMin = estimateTravelTime(dist);
  const mapsUrl = `https://www.openstreetmap.org/directions?engine=graphhopper_car&route=${USER_LAT},${USER_LNG};${org.latitude},${org.longitude}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${org.longitude - 0.02},${org.latitude - 0.01},${org.longitude + 0.02},${org.latitude + 0.01}&layer=mapnik&marker=${org.latitude},${org.longitude}`;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to={-1} className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-xl font-bold text-white">{t('mapView')}</h1>
            <p className="text-sm text-slate-500">{org.name}</p>
          </div>
        </div>

        {/* Map embed (OpenStreetMap – no API key needed) */}
        <div className="card overflow-hidden mb-5">
          <div className="bg-navy-800 px-4 py-2 flex items-center gap-2 border-b border-surface-border">
            <MapPin size={14} className="text-brand" />
            <span className="text-sm text-slate-400">{org.address}</span>
            <span className="ml-auto text-xs text-slate-600">OpenStreetMap (Demo)</span>
          </div>
          <iframe
            title="Organization location"
            src={embedUrl}
            className="w-full h-64 sm:h-80"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
            loading="lazy"
          />
        </div>

        {/* Travel info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="stat-card">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Car size={11} /> Distance</p>
            <p className="text-2xl font-bold text-white">{dist.toFixed(1)} <span className="text-sm text-slate-500">{t('km')}</span></p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11} /> {t('travelETA')}</p>
            <p className="text-2xl font-bold text-white">{travelMin} <span className="text-sm text-slate-500">{t('min')}</span></p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-500">Traffic</p>
            <p className="text-lg font-bold text-emerald-400">Moderate</p>
          </div>
        </div>

        <div className="card p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Address</span>
            <span className="text-white text-right max-w-[60%]">{org.address}</span>
          </div>
          {org.phone && (
            <div className="flex justify-between">
              <span className="text-slate-500">Phone</span>
              <a href={`tel:${org.phone}`} className="text-brand">{org.phone}</a>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Open Hours</span>
            <span className="text-white">{org.openTime} – {org.closeTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Coordinates</span>
            <span className="text-slate-400 text-xs">{org.latitude.toFixed(4)}, {org.longitude.toFixed(4)}</span>
          </div>
        </div>

        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          <Navigation size={16} /> {t('getDirections')} — OpenStreetMap
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
