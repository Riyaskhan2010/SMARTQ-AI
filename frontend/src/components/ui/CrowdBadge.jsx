import { useLanguage } from '../../context/LanguageContext';

export default function CrowdBadge({ level }) {
  const { t } = useLanguage();
  const map = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', VERY_HIGH: 'badge-very_high' };
  return <span className={map[level] || 'badge-medium'}>{t(level) || level}</span>;
}
