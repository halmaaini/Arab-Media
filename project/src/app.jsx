/* ===== app.jsx — root router ===== */

function Shell() {
  const { route, trackId, npOpen } = useApp();
  const v = route.view;
  const isOwner = v.startsWith('owner');

  const PUBLIC = {
    home: Home, browse: Browse, detail: Detail, library: Library,
    categories: Categories, category: Category, about: About, publisher: Publisher,
    contact: Contact, more: More,
  };
  const OWNER = {
    'owner-login': OwnerLogin, 'owner-dash': OwnerDash, 'owner-content': OwnerContent,
    'owner-edit': OwnerEdit, 'owner-messages': OwnerMessages, 'owner-settings': OwnerSettings,
  };

  if (isOwner) {
    const C = OWNER[v] || OwnerLogin;
    return (<><C /><Toasts /></>);
  }

  const C = PUBLIC[v] || Home;
  return (
    <div className="app">
      <Header />
      <main className="app-main" style={{ paddingBottom: trackId ? 96 : 24 }}>
        <C key={v + JSON.stringify(route.params)} />
      </main>
      <Footer />
      <div className="bottom-dock">
        <MiniPlayer />
        <div className="mobile-only"><BottomNav /></div>
      </div>
      {trackId && <NowPlaying />}
      <Toasts />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
