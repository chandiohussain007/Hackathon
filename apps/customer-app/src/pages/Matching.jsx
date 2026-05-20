/* Provider Matching Screen — KhidmatAI
   Ported from stitch_khidmatai_premium_ai_orchestrator/provider_matching/code.html */

function StarBadge({ rating }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: '#eeeef0', fontSize: '11px', fontWeight: 600, color: '#3f4940', letterSpacing: '0.05em' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#cba72f', fontVariationSettings: "'FILL' 1" }}>star</span>
      {rating}% Rating
    </span>
  );
}

function ProviderCard({ provider, rank, onBook, isTop }) {
  const name = provider.provider_name || provider.name || 'Provider';
  const rating = Math.round((provider.score || 0.85) * 100);
  const distance = provider.distance_km ? `${provider.distance_km.toFixed(1)} km` : '< 5 km';
  const price = provider.base_rate_pkr || 2500;
  const service = provider.services?.[0]?.service_type || 'Service';

  return (
    <div className="relative overflow-hidden"
         style={{
           background: isTop ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)',
           backdropFilter: 'blur(20px)',
           border: isTop ? '1px solid rgba(0,75,36,0.4)' : '1px solid rgba(255,255,255,0.4)',
           borderRadius: '16px',
           boxShadow: isTop ? '0 0 40px rgba(0,75,36,0.1)' : '0 4px 16px rgba(0,0,0,0.04)',
           padding: '16px',
           marginBottom: '12px',
         }}>

      {isTop && (
        <div className="absolute top-0 right-0 px-3 py-1 flex items-center gap-1"
             style={{ background: '#004b24', borderRadius: '0 16px 0 12px', fontSize: '11px', fontWeight: 600, color: 'white', letterSpacing: '0.05em' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          AI Pick
        </div>
      )}

      <div className="flex gap-4 pt-2">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2"
               style={{
                 background: `linear-gradient(135deg, #004b24, #006633)`,
                 color: 'white',
                 borderColor: isTop ? '#9ff6b4' : 'rgba(255,255,255,0.5)',
               }}>
            {name.charAt(0)}
          </div>
        </div>

        {/* Details */}
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-1">
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#1a1c1e' }}>{name}</h3>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#004b24' }}>PKR {price.toLocaleString()}</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <StarBadge rating={rating} />
            {provider.profile_verified && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full"
                    style={{ background: 'rgba(0,75,36,0.08)', fontSize: '11px', fontWeight: 600, color: '#004b24', letterSpacing: '0.05em' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                Verified
              </span>
            )}
            <span className="px-2 py-1 rounded-full"
                  style={{ background: '#eeeef0', fontSize: '11px', fontWeight: 600, color: '#3f4940', letterSpacing: '0.05em' }}>
              #{rank} Match
            </span>
          </div>

          <div className="flex items-center gap-4 mb-3"
               style={{ fontSize: '13px', color: '#57605d' }}>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>location_on</span>
              {distance}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
              ~{Math.round((provider.distance_km || 3) * 5 + 10)} min ETA
            </span>
          </div>

          <button
            onClick={() => onBook(provider)}
            className="w-full py-2.5 rounded-xl transition-all active:scale-95"
            style={isTop ? {
              background: 'linear-gradient(180deg, #004b24 0%, #006633 100%)',
              color: 'white', fontSize: '14px', fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0,75,36,0.25)',
            } : {
              background: '#eeeef0', color: '#1a1c1e', fontSize: '14px', fontWeight: 500,
            }}>
            {isTop ? 'Book Now →' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Matching({ sessionData, onBook, onBack }) {
  const providers = sessionData?.ranked_providers || [];
  const intent = sessionData?.parsed_intent || {};
  const serviceLabel = (intent.service_type || 'service').replace(/_/g, ' ');

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16"
              style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,75,36,0.06)' }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: '#eeeef0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#1a1c1e' }}>arrow_back</span>
        </button>
        <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#004b24', textTransform: 'capitalize' }}>
          {serviceLabel} Experts
        </h1>
        <div className="w-9" />
      </header>

      <main className="pt-20 pb-8 px-5 max-w-2xl mx-auto w-full">
        {/* AI analysis header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 ai-glow"
               style={{ background: 'rgba(0,75,36,0.08)' }}>
            <span className="material-symbols-outlined pulse-glow" style={{ fontSize: '28px', color: '#004b24', fontVariationSettings: "'FILL' 1" }}>manage_search</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#004b24', marginBottom: '6px' }}>
            {providers.length} Experts Found
          </h2>
          <p style={{ color: '#57605d', fontSize: '14px', maxWidth: '300px' }}>
            KhidmatAI ranked {providers.length} providers for your {serviceLabel} request.
          </p>
          {intent.confidence && (
            <div className="mt-2 px-3 py-1 rounded-full"
                 style={{ background: 'rgba(0,75,36,0.08)', fontSize: '12px', fontWeight: 600, color: '#004b24' }}>
              {Math.round(intent.confidence * 100)}% match confidence
            </div>
          )}
        </div>

        {/* AI Suggestion banner */}
        {providers.length > 0 && (
          <div className="flex items-start gap-3 p-4 mb-4 rounded-xl border-l-4"
               style={{ background: 'rgba(0,75,36,0.04)', borderColor: '#004b24' }}>
            <span className="material-symbols-outlined mt-0.5" style={{ color: '#004b24', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#004b24', letterSpacing: '0.08em', marginBottom: '3px' }}>AI RECOMMENDATION</p>
              <p style={{ fontSize: '14px', color: '#1a1c1e' }}>
                <strong>{providers[0]?.provider_name || 'Top provider'}</strong> is your best match based on rating, proximity, and availability.
              </p>
            </div>
          </div>
        )}

        {/* Provider cards */}
        {providers.length > 0 ? (
          providers.map((p, i) => (
            <ProviderCard key={p.provider_id || i} provider={p} rank={i + 1} onBook={onBook} isTop={i === 0} />
          ))
        ) : (
          <div className="text-center py-16">
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#bfc9bd' }}>sentiment_dissatisfied</span>
            <p style={{ color: '#57605d', marginTop: '12px' }}>No providers found in your area right now.</p>
            <p style={{ color: '#57605d', fontSize: '13px', marginTop: '4px' }}>{sessionData?.fallback_message}</p>
          </div>
        )}
      </main>
    </div>
  );
}
