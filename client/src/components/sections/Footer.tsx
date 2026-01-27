/**
 * DESIGN: Digital Fortress Vault - Footer
 * Clean, professional footer with trust elements
 */

import { Shield, Lock, Phone, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-950 border-t border-slate-800">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Window Man</h3>
                <p className="text-xs text-slate-500">Your Hurricane Hero</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              Florida's trusted advocate for homeowners navigating the impact window industry. 
              We expose hidden markups and protect you from contractor tricks.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Quote Scanner
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Price Calculator
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Contractor Database
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">
                  Hurricane Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="tel:555-GLASS" 
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  555-GLASS
                </a>
              </li>
              <li>
                <a 
                  href="mailto:help@itswindowman.com" 
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  help@itswindowman.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {currentYear} Window Man. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              256-bit SSL Encrypted
            </span>
            <span>•</span>
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
