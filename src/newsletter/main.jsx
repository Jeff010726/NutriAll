import { createRoot } from 'react-dom/client';
import { NewsletterManager } from './NewsletterManager';
import './newsletter.css';
createRoot(document.getElementById('newsletter-root')).render(<NewsletterManager />);
