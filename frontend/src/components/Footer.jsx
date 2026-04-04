import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();

  if (location.pathname.startsWith('/manager') || location.pathname.startsWith('/admin')) {
      return null;
  }

  return (
    <footer className="elite-footer mt-28">
      {/* Decorative Divider Line */}
      <div className="footer-divider"></div>

      <div className="container-xl pt-28 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-20 gap-y-20 lg:gap-x-28">
          
          {/* 1. Brand Section */}
          <div className="footer-col" data-aos="fade-up">
            <h2 className="footer-logo mb-6">
              <a href="/" className="flex flex-col">
                <span className="brand-name">Elite Stays</span>
                <span className="brand-tagline">LUXURY RENTALS</span>
              </a>
            </h2>
            <p className="footer-about-text mb-8 leading-relaxed">
              Experience the pinnacle of comfort and sophistication. We curate the finest properties across India for your perfect holiday.
            </p>
            <div className="footer-socials flex gap-5">
              <a href="#" className="social-btn" aria-label="Facebook"><i className="fa fa-facebook"></i></a>
              <a href="#" className="social-btn" aria-label="Instagram"><i className="fa fa-instagram"></i></a>
              <a href="#" className="social-btn" aria-label="Twitter"><i className="fa fa-twitter"></i></a>
              <a href="#" className="social-btn" aria-label="LinkedIn"><i className="fa fa-linkedin"></i></a>
            </div>
          </div>

          {/* 2. Quick Links */}
          <div className="footer-col" data-aos="fade-up" data-aos-delay="100">
            <h3 className="footer-heading mb-10">Quick Links</h3>
            <ul className="footer-links-list space-y-6">
              <li><a href="/" className="footer-link">Home</a></li>
              <li><a href="/rooms" className="footer-link">Hotels</a></li>
              <li><a href="/about" className="footer-link">About Us</a></li>
              <li><a href="/contact" className="footer-link">Contact</a></li>
            </ul>
          </div>

          {/* 3. Support Section */}
          <div className="footer-col" data-aos="fade-up" data-aos-delay="200">
            <h3 className="footer-heading mb-10">Support</h3>
            <ul className="footer-links-list space-y-6">
              <li><a href="/help" className="footer-link">Help Center</a></li>
              <li><a href="/terms" className="footer-link">Terms & Conditions</a></li>
              <li><a href="/privacy" className="footer-link">Privacy Policy</a></li>
              <li><a href="/refund" className="footer-link">Refund Policy</a></li>
            </ul>
          </div>

          {/* 4. Contact Section */}
          <div className="footer-col" data-aos="fade-up" data-aos-delay="300">
            <h3 className="footer-heading mb-10">Get in Touch</h3>
            <div className="footer-contact-info space-y-8">
              <div className="contact-item flex items-start gap-4 group">
                <div className="contact-icon-wrap w-8 h-8 rounded-full bg-[#6d5dfc]/10 flex items-center justify-center shrink-0 group-hover:bg-[#6d5dfc] transition-colors">
                  <i className="fa fa-map-marker text-[#6d5dfc] group-hover:text-white transition-colors"></i>
                </div>
                <span className="text-[#94a3b8] text-[14px]">123 Marina Beach Road, Chennai, Tamil Nadu, India</span>
              </div>
              <div className="contact-item flex items-center gap-4 group">
                <div className="contact-icon-wrap w-8 h-8 rounded-full bg-[#6d5dfc]/10 flex items-center justify-center shrink-0 group-hover:bg-[#6d5dfc] transition-colors">
                  <i className="fa fa-phone text-[#6d5dfc] group-hover:text-white transition-colors"></i>
                </div>
                <a href="tel:+919876543210" className="footer-link text-[14px]">+91 98765 43210</a>
              </div>
              <div className="contact-item flex items-center gap-4 group">
                <div className="contact-icon-wrap w-8 h-8 rounded-full bg-[#6d5dfc]/10 flex items-center justify-center shrink-0 group-hover:bg-[#6d5dfc] transition-colors">
                  <i className="fa fa-paper-plane text-[#6d5dfc] group-hover:text-white transition-colors"></i>
                </div>
                <a href="mailto:info@elitestays.com" className="footer-link text-[14px]">info@elitestays.com</a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar Section */}
      <div className="footer-bottom py-10 border-t border-white/5 bg-[#08080a]">
        <div className="container-xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="copyright-text text-[13px] text-slate-500 font-light">
              © {new Date().getFullYear()} <span className="text-slate-200 font-medium tracking-wide">Elite Stays</span>. All rights reserved.
            </p>
            <div className="footer-legal-links flex items-center gap-8">
              <a href="#" className="legal-link">Terms</a>
              <a href="#" className="legal-link">Security</a>
              <a href="#" className="legal-link">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
