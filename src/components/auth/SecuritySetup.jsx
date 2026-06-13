import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateSecurityQuestion, skipSecuritySetup } from '../../services/authService';

export default function SecuritySetup() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error('Please enter a security question');
      return;
    }
    if (!answer.trim()) {
      toast.error('Please enter an answer');
      return;
    }

    setIsLoading(true);
    try {
      await updateSecurityQuestion(
        question.trim(),
        answer.trim()
      );
      toast.success('Security question saved successfully');
      navigate('/settings');
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await skipSecuritySetup();
      navigate('/settings');
    } catch {
      // Navigate anyway on skip failure
      navigate('/settings');
    } finally {
      setIsSkipping(false);
    }
  };

  const isBusy = isLoading || isSkipping;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-adani-lightGray px-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-card p-8">
        {/* Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="h-14 w-14 rounded-full bg-adani-navy/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-adani-navy"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-lg font-bold text-adani-navy text-center mb-1">
          Security Question Setup
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Set up your security question for account recovery
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Question */}
          <div>
            <label
              htmlFor="sq-question"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Your Security Question
            </label>
            <input
              id="sq-question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is your pets name?"
              disabled={isBusy}
              className="w-full h-10 px-3 text-sm text-gray-900 placeholder-gray-400
                         border border-adani-border rounded-md
                         focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Answer */}
          <div>
            <label
              htmlFor="sq-answer"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Your Answer
            </label>
            <input
              id="sq-answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
              disabled={isBusy}
              className="w-full h-10 px-3 text-sm text-gray-900 placeholder-gray-400
                         border border-adani-border rounded-md
                         focus:outline-none focus:ring-2 focus:ring-adani-navy focus:border-adani-navy
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isBusy}
              className="flex-1 h-10 bg-white text-adani-navy text-sm font-semibold rounded-lg
                         border border-adani-border
                         hover:bg-gray-50 active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
            >
              {isSkipping ? (
                <svg className="animate-spin h-5 w-5 text-adani-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Skip for Now'
              )}
            </button>

            <button
              type="submit"
              disabled={isBusy}
              className="flex-1 h-10 bg-adani-red text-white text-sm font-semibold rounded-lg
                         hover:bg-adani-redDark active:scale-[0.98] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Save & Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
