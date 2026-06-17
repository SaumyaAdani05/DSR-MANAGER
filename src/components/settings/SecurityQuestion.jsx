import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { verifySecurityAnswer, updateSecurityQuestion } from '../../services/authService';

const SecurityQuestion = ({ currentQuestion, onUpdate }) => {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Only auto-verify if parent tells us no question exists (first login/setup).
    // Avoid running before currentQuestion is loaded (undefined).
    if (currentQuestion === undefined) return;
    if (!currentQuestion) {
      setVerified(true);
    } else {
      setVerified(false);
    }
  }, [currentQuestion]);

  const handleVerify = async () => {
    if (!currentAnswer.trim()) return;
    setLoading(true);
    try {
      await verifySecurityAnswer(currentAnswer.toLowerCase().trim());
      setVerified(true);
      toast.success('Identity verified');
    } catch (error) {
      toast.error(error.message || 'Incorrect answer');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setLoading(true);
    try {
      await updateSecurityQuestion(newQuestion.trim(), newAnswer.trim());
      toast.success('Security question updated');
      setCurrentAnswer('');
      setNewQuestion('');
      setNewAnswer('');
      if (onUpdate) {
        await onUpdate();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update security question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {currentQuestion && (
        <div className="p-3 bg-adani-lightGray rounded-lg">
          <p className="text-xs font-medium text-adani-gray mb-1">Current Question</p>
          <p className="text-sm text-gray-800">{currentQuestion}</p>
        </div>
      )}

      {!verified && currentQuestion && (
        <div className="space-y-3">
          <Input
            label="Current Answer (verify identity)"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Enter your answer"
          />
          <Button onClick={handleVerify} loading={loading} variant="secondary">
            Verify Identity
          </Button>
        </div>
      )}

      {verified && (
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="New Security Question"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Enter your new security question"
          />
          <Input
            label="New Answer"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Enter your answer"
          />
          <Button
            type="submit"
            disabled={!newQuestion.trim() || !newAnswer.trim()}
            loading={loading}
          >
            Update Security Question
          </Button>
        </form>
      )}
    </div>
  );
};

export default SecurityQuestion;
