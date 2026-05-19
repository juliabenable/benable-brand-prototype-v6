import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createCampaignStep1,
  createCampaignStep2,
  createCampaignStep3,
} from '../data/capturedHtml.js';

const STEPS = [createCampaignStep1, createCampaignStep2, createCampaignStep3];

export default function CreateCampaignPage() {
  const [step, setStep] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const txt = btn.textContent.trim();
      if (txt === 'Get Started' || txt === 'Choose Gift Card Amount') {
        e.preventDefault();
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
      } else if (txt === 'Back') {
        e.preventDefault();
        if (step === 0) navigate('/brand/tonypikora/campaigns');
        else setStep((s) => Math.max(s - 1, 0));
      } else if (txt === 'Back to Campaigns') {
        e.preventDefault();
        navigate('/brand/tonypikora/campaigns');
      } else if (txt === 'Create My Campaign') {
        e.preventDefault();
        // For the prototype, route back to the campaigns list after "create".
        navigate('/brand/tonypikora/campaigns');
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [navigate, step]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: STEPS[step] }} />;
}
