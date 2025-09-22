import { useUiStore } from './store';

export default function Banner() {
  const banner = useUiStore((s) => s.banner);
  const clear = useUiStore((s) => s.clearBanner);
  if (!banner) return null;
  const color = banner.kind === 'success' ? 'bg-green-600' : banner.kind === 'error' ? 'bg-red-600' : 'bg-gray-800';
  return (
    <div className={`${color} text-white px-4 py-2`}> 
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <span className="text-sm">{banner.message}</span>
        <button className="text-sm underline" onClick={clear}>Dismiss</button>
      </div>
    </div>
  );
}


