import { NavLink, Link, useLocation } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import { isAddress, TARGET_CHAIN_ID } from '../config/chain';
import { Icon } from './Icons';
import { StatusTag } from './StatusTag';

const nav = [
  { to: '/lab', label: 'The Lab', icon: 'grid' },
  { to: '/precedents', label: 'Precedent registry', icon: 'book' },
  { to: '/precedents/new', label: 'Register a record', icon: 'plus' },
  { to: '/compare', label: 'Compare judgments', icon: 'compare' },
  { to: '/graph', label: 'Lineage graph', icon: 'graph' },
  { to: '/case-court', label: 'Case Court', icon: 'book' },
  { to: '/tribunal', label: 'Contradiction tribunal', icon: 'compare' },
  { to: '/simulate', label: 'Counterfactual lab', icon: 'spark' },
  { to: '/verify', label: 'Verification trail', icon: 'shield' },
  { to: '/web-evidence', label: 'Web evidence', icon: 'external' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
] as const;

const titleFor: Record<string, string> = {
  '/lab': 'Research lab', '/precedents': 'Precedent registry', '/precedents/new': 'Register precedent',
  '/compare': 'Judgment comparison', '/graph': 'Judgment lineage', '/simulate': 'Counterfactual lab',
  '/case-court': 'Case Court', '/tribunal': 'Contradiction tribunal',
  '/verify': 'Verification trail', '/web-evidence': 'Web evidence', '/settings': 'Network & wallet',
};

export function Workspace({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { wallet, connect, disconnect, walletError, addresses } = useApp();
  const title = titleFor[location.pathname] ?? (location.pathname.startsWith('/precedents/') ? 'Precedent record' : 'Evaluation record');
  const contractsConfigured = isAddress(addresses.registry) && isAddress(addresses.evaluator) && isAddress(addresses.caseCourt);
  const onCorrectChain = wallet?.chainId === TARGET_CHAIN_ID;
  return <div className="workspace">
    <aside className="sidebar">
      <Link className="brand" to="/" aria-label="PrecedentOS home"><span className="brand-mark">P<span>O</span></span><span className="brand-word">PRECEDENT<span>OS</span></span></Link>
      <div className="sidebar-kicker">RESEARCH / 01</div>
      <nav aria-label="Primary navigation" className="side-nav">
        {nav.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}>
          <Icon name={item.icon} size={17} /><span>{item.label}</span>
          {item.to === '/web-evidence' && <span className="nav-soon">ALLOWLIST</span>}
        </NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-statement">Consensus is a process.<br />Correctness is a question.</div>
        <div className={`sidebar-network${wallet ? (onCorrectChain ? ' is-connected' : ' is-wrong-chain') : ''}`}>
          <span className="network-signal" />
          <div><b>STUDIONET</b><small>{wallet ? `CHAIN ${wallet.chainId} · ${onCorrectChain ? 'CONNECTED' : 'WRONG NETWORK'}` : `CHAIN ${TARGET_CHAIN_ID} · WALLET NOT CONNECTED`}</small></div>
        </div>
      </div>
    </aside>
    <main className="workspace-main">
      <header className="topbar">
        <div className="topbar-title"><span className="breadcrumb">PRECEDENTOS / WORKSPACE</span><strong>{title}</strong></div>
        <div className="topbar-actions">
          <StatusTag tone={contractsConfigured ? 'good' : 'warn'}>{contractsConfigured ? 'CONTRACTS CONFIGURED' : 'CONTRACTS NOT CONFIGURED'}</StatusTag>
          {wallet ? <button className="wallet-pill connected" onClick={disconnect} title="Disconnect wallet"><span className="wallet-led" />{wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}<span className="wallet-chain">{wallet.chainId}</span></button> : <button className="button button--dark button--small" onClick={connect}><Icon name="wallet" size={16} /> Connect wallet</button>}
        </div>
      </header>
      {walletError && <div role="alert" className="global-error">{walletError}</div>}
      {wallet && !onCorrectChain && <div role="alert" className="global-error">Wallet is on chain {wallet.chainId}; PrecedentOS requires stable Studionet {TARGET_CHAIN_ID}. Switch networks before submitting a transaction.</div>}
      {children}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {nav.slice(0, 6).map((item) => <NavLink key={item.to} to={item.to} aria-label={item.label} className={({ isActive }) => `mobile-nav-item${isActive ? ' is-active' : ''}`}><Icon name={item.icon} size={18} /><span>{item.label.split(' ')[0]}</span></NavLink>)}
    </nav>
  </div>;
}
