import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons';
import { StatusTag } from '../components/StatusTag';
import { useApp } from '../state/AppContext';
import { TARGET_CHAIN_ID } from '../config/chain';

export function Landing() {
  const { wallet } = useApp();
  const onCorrectChain = wallet?.chainId === TARGET_CHAIN_ID;
  return <main className="landing">
    <header className="landing-nav"><a className="brand brand--dark" href="/"><span className="brand-mark">P<span>O</span></span><span className="brand-word">PRECEDENT<span>OS</span></span></a><div className="landing-nav-right"><StatusTag tone={wallet ? (onCorrectChain ? 'good' : 'bad') : 'warn'}>{wallet ? `STUDIONET · ${onCorrectChain ? 'CONNECTED' : 'WRONG NETWORK'}` : 'STUDIONET · NOT CONNECTED'}</StatusTag><Link to="/lab" className="landing-enter">ENTER THE LAB <Icon name="arrow" size={16}/></Link></div></header>
    <div className="landing-grid">
      <section className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line"/> A PRECEDENT-AWARE RESEARCH PROTOCOL <span className="eyebrow-index">[ 01 — 04 ]</span></div>
        <h1>PRECEDENT<br/><span>IS A</span><br/>QUESTION<span className="hero-period">.</span></h1>
        <p className="hero-subtitle">A judgment is a decision.<br/>A precedent is a relationship between decisions.</p>
        <p className="hero-copy-body">Explore fictional cases. Compare the evidence that matters. Trace how a conclusion was reached — and what the validators actually agreed to.</p>
        <div className="hero-actions"><Link to="/lab" className="button button--acid">Open the research lab <Icon name="arrow" size={18}/></Link><Link to="/compare" className="text-link">Start a comparison <span>↗</span></Link></div>
        <div className="hero-notice"><span className="notice-mark">!</span><span>Research signal, not legal advice. Validator agreement does not establish legal correctness.</span></div>
      </section>
      <section className="hero-instrument" aria-label="Illustration of evidence passing through independent validator review">
        <div className="instrument-label instrument-label--top">INPUT / EVIDENCE / 02 CASES</div>
        <div className="instrument-orbit orbit-one"/><div className="instrument-orbit orbit-two"/>
        <div className="specimen specimen-a"><span className="specimen-index">A / FICT-MUNI-001</span><b>WALKWAY<br/>ACCESS</b><small>1.4m · RULE 1.8m</small><i className="specimen-bar"/></div>
        <div className="specimen specimen-b"><span className="specimen-index">B / FICT-MUNI-002</span><b>RAIN<br/>SHELTER</b><small>EXCEPTION · 48 HOURS</small><i className="specimen-bar"/></div>
        <div className="instrument-spine"><span>COMPARE</span><i/><span>VERIFY</span></div>
        <div className="validator-dial"><div className="dial-ring"><span className="dial-center">EP</span><i className="dial-tick tick-one"/><i className="dial-tick tick-two"/><i className="dial-tick tick-three"/><i className="dial-tick tick-four"/></div><small>VALIDATOR<br/>PROCESS</small></div>
        <div className="instrument-result"><span className="result-state">DEMO RESULT / NOT ON-CHAIN</span><b>MATERIAL<br/>SIMILARITY</b><span>OUTCOMES DIFFER · EXCEPTION EXPLAINS</span></div>
        <div className="instrument-label instrument-label--bottom">NO LIVE VALIDATOR VOTES SHOWN</div>
        <div className="hero-index">P/OS<br/>61999</div>
      </section>
    </div>
    <div className="landing-foot"><span>CHROMATIC JURISPRUDENCE / 2026</span><span>GENLAYER INTELLIGENT CONTRACTS</span><span>BUILT FOR QUESTIONS, NOT VERDICTS</span></div>
    <section className="landing-process"><div className="process-intro"><span className="section-label"><span>02</span><span>THE PROTOCOL</span></span><h2>SHOW YOUR WORK.</h2><p>Every comparison carries its own evidence trail. The interface distinguishes a demo from a chain observation, and an accepted result from a finalized one.</p></div><div className="process-steps"><article><span>01 / COMMIT</span><b>Register a record</b><p>Anchor an immutable digest and bounded public metadata. The document stays off-chain.</p></article><article><span>02 / COMPARE</span><b>Supply the passages</b><p>Choose two cases, provide exact evidence excerpts and make the comparison criteria explicit.</p></article><article><span>03 / VERIFY</span><b>Inspect the trail</b><p>Review the decision fields, input commitment and actual transaction lifecycle when available.</p></article></div></section>
  </main>;
}
