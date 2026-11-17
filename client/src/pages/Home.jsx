// Home.jsx - Página de inicio / landing (portada del index.html original)
import { Navbar, Footer } from '../components/PublicChrome';
import SupportWidget from '../components/SupportWidget';
import { useLanguage } from '../i18n/LanguageContext';
import { useState, useEffect } from 'react';
import c1 from '../assets/carousel1.png';
import c2 from '../assets/carousel2.png';
import c3 from '../assets/carousel3.png';
import c4 from '../assets/carousel4.png';
import c5 from '../assets/carousel5.png';
import c6 from '../assets/carousel6.png';

function Home({ onNavigate }) {
    const { t } = useLanguage();
    const slides = [c1, c2, c3, c4, c5, c6];
    const [slide, setSlide] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setSlide(s => (s + 1) % slides.length), 3500);
        return () => clearInterval(id);
    }, []);

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
                    <div className="carousel-container" style={{ position: 'relative', background: '#fff' }}>
                        {slides.map((src, i) => (
                            <img key={i} src={src} alt={`Horario ${i + 1}`}
                                style={{
                                    width: '100%', height: '400px',
                                    objectFit: 'contain', background: '#fff',
                                    display: i === slide ? 'block' : 'none'
                                }} />
                        ))}
                        <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0,
                                      display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {slides.map((_, i) => (
                                <span key={i} onClick={() => setSlide(i)}
                                    style={{ width: '10px', height: '10px', borderRadius: '50%',
                                             cursor: 'pointer',
                                             background: i === slide ? '#fff' : 'rgba(255,255,255,0.5)',
                                             border: '1px solid rgba(0,0,0,0.2)' }} />
                            ))}
                        </div>
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
