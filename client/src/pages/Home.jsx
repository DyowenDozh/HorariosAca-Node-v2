// Home.jsx - Página de inicio / landing (portada del index.html original)
import { Navbar, Footer } from '../components/PublicChrome';
import SupportWidget from '../components/SupportWidget';
import { useLanguage } from '../i18n/LanguageContext';
import heroImg from '../assets/hero.png';

function Home({ onNavigate }) {
    const { t } = useLanguage();

    return (
        <div className="auth-page">
            <Navbar view="home" onNavigate={onNavigate} />

            <main className="home-main">
                <section className="hero-intro">
                    <div className="purple-banner-main">
                        <h2>{t('home_hero_title')}</h2>
                        <ul>
                            <li>{t('home_hero_step1')}</li>
                            <li>{t('home_hero_step2')}</li>
                            <li>{t('home_hero_step3')}</li>
                            <li>{t('home_hero_step4')}</li>
                        </ul>
                    </div>
                </section>

                <section className="promo-section">
                    <div className="carousel-container">
                        {heroImg
                            ? <img src={heroImg} alt="HorariosAca" style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }} />
                            : <div className="carousel-placeholder">Vista previa de horarios</div>}
                    </div>

                    <div className="purple-premium-box">
                        <a className="premium-link" onClick={() => onNavigate('plans')}>
                            {t('home_premium_click')}
                        </a>

                        <div className="premium-advantages">
                            <h3>{t('home_adv_title')}</h3>
                            <ul>
                                <li>{t('home_adv_1')}</li>
                                <li>{t('home_adv_2')}</li>
                                <li>{t('home_adv_3')}</li>
                                <li>{t('home_adv_4')}</li>
                            </ul>

                            <h3>{t('home_feat_title')}</h3>
                            <ul>
                                <li>{t('home_feat_1')}</li>
                                <li>{t('home_feat_2')}</li>
                                <li>{t('home_feat_3')}</li>
                                <li>{t('home_feat_4')}</li>
                                <li>{t('home_feat_5')}</li>
                                <li>{t('home_feat_6')}</li>
                                <li>{t('home_feat_7')}</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>

            <SupportWidget />
            <Footer onNavigate={onNavigate} />
        </div>
    );
}

export default Home;
