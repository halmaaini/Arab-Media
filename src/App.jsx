/* ===== App.jsx — root router ===== */
import { AppProvider, useApp } from './store.jsx';
import { Header, Footer, BottomNav, Toasts } from './shell.jsx';
import { MiniPlayer, NowPlaying } from './player.jsx';
import { Home } from './home.jsx';
import { Browse } from './browse.jsx';
import { Detail } from './detail.jsx';
import { Library, Categories, Category, About, Publisher, Contact, More } from './pages.jsx';
import { OwnerLogin, OwnerDash, OwnerContent, OwnerEdit, OwnerMessages, OwnerSettings } from './owner.jsx';

const PUBLIC = {
  home: Home, browse: Browse, detail: Detail, library: Library,
  categories: Categories, category: Category, about: About, publisher: Publisher,
  contact: Contact, more: More,
};

const OWNER_VIEWS = {
  'owner-login': OwnerLogin, 'owner-dash': OwnerDash, 'owner-content': OwnerContent,
  'owner-edit': OwnerEdit, 'owner-messages': OwnerMessages, 'owner-settings': OwnerSettings,
};

function Shell() {
  const { route, trackId, npOpen } = useApp();
  const v = route.view;
  const isOwner = v.startsWith('owner');

  if (isOwner) {
    const C = OWNER_VIEWS[v] || OwnerLogin;
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

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
