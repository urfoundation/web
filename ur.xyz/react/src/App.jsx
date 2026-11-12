import React from 'react';
import './App.css';

import Disclaimer, { useDisclaimerVisible } from './components/Disclaimer';
import Nav from './components/Nav';
import Hero from './components/Hero';
import HomepageIntro from './components/HomepageIntro';
import StatsPanel from './components/StatsPanel';
import Footer from './components/Footer';
import LaunchVideo from './components/LaunchVideo';
import { useClock, useNetworkTotals } from './lib/network';

import LandingOverview from './components/LandingOverview';
import Research from './components/sections/Research';
import Operators from './components/sections/Operators';
import Miners from './components/sections/Miners';
import Validators from './components/sections/Validators';
import PriceSection from './components/PriceSection';
import LegalSection from './components/LegalSection';

import DocsExplorer from './components/DocsExplorer';
import AboutPage from './components/pages/About';
import InvestorsPage from './components/pages/Investors';
import BuildPage from './components/pages/Build';
import ReservePage from './components/pages/Reserve';
import MainnetPage from './components/pages/Mainnet';
import CtfPage from './components/pages/Ctf';
import CtfCountryPage from './components/pages/CtfCountry';
import DashboardPage from './components/pages/Dashboard';
import ResearchReportPage from './components/pages/ResearchReport';
import ResearchMethodologyPage from './components/pages/ResearchMethodology';
import { useRoute } from './router';
import { useLanguage } from './i18n';

const Terms = ({ lang }) => <LegalSection doc="terms" lang={lang} />;
const Privacy = ({ lang }) => <LegalSection doc="privacy" lang={lang} />;
const Vdp = ({ lang }) => <LegalSection doc="vdp" lang={lang} />;
// capture the flag: the hub at /ctf, a country's page at /ctf/<cc>
const Ctf = ({ route, lang }) => (route.slug ? <CtfCountryPage code={route.slug} lang={lang} /> : <CtfPage lang={lang} />);

/** Map route names to their section component. */
const SECTION_COMPONENTS = {
    operators:  Operators,
    miners:     Miners,
    validators: Validators,
    research:   Research,
    price:      PriceSection,
    terms:      Terms,
    privacy:    Privacy,
    vdp:        Vdp,
    // the page groups' pages (router PAGE_ROUTES); the Astro build renders
    // the same components from its thin pages, so they stay one source
    about:      AboutPage,
    investors:  InvestorsPage,
    build:      BuildPage,
    reserve:    ReservePage,
    mainnet:    MainnetPage,
    ctf:        Ctf,
    // a research report, /research/<slug> (router RESEARCH_REPORT_SLUGS)
    'research-report': ResearchReportPage,
    // the research methodology, /research/methodology
    'research-methodology': ResearchMethodologyPage,
};

/**
 * App
 *
 * Top-level router. Each content section lives at its own path.
 * The docs and API explorers have their own views. Everything else
 * falls through to the simulation landing page.
 */
export default function App() {
    const route = useRoute();
    // every page component takes the page's language as `lang`, as the Astro
    // pages pass it (react/src/i18n/README.md)
    const { code } = useLanguage();

    if (route.name === 'docs') return <DocsExplorer lang={code} />;
    // standalone: its own shell, not the site's chrome
    if (route.name === 'dashboard') return <DashboardPage lang={code} />;

    const SectionComponent = SECTION_COMPONENTS[route.name];
    if (SectionComponent) return <SectionPage Component={SectionComponent} route={route} />;

    return <HomePage />;
}

/**
 * HomePage
 *
 * The landing page: simulation hero, protocol ledger stats panel, overview,
 * and role cards. The StatsPanel detaches from the hero, docks at the
 * homepage introduction, then expands
 * into a sticky ticker bar.
 */
function HomePage() {
    const now = useClock();
    const network = useNetworkTotals();
    const disclaimerVisible = useDisclaimerVisible();

    return (
        <div className="app">
            <Disclaimer visible={disclaimerVisible} />
            <Nav disclaimerVisible={disclaimerVisible} />
            <Hero network={network} />
            <StatsPanel
                now={now}
                network={network}
                anchorId="stats-anchor"
                disclaimerVisible={disclaimerVisible}
            />

            <main className="landing-main">
                <HomepageIntro />
                <LandingOverview />
            </main>

            <Footer />
            <LaunchVideo />
        </div>
    );
}

/**
 * SectionPage
 *
 * Wraps a single section component in the shared site chrome:
 * Disclaimer, Nav, section content, Footer.
 */
function SectionPage({ Component, route }) {
    const disclaimerVisible = useDisclaimerVisible();
    const { code } = useLanguage();

    return (
        <div className="app">
            <Disclaimer visible={disclaimerVisible} />
            <Nav disclaimerVisible={disclaimerVisible} />

            <main className="section-page">
                <Component route={route} lang={code} />
            </main>

            <Footer />
        </div>
    );
}
