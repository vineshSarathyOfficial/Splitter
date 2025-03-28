'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function InviteButton({ groupId, inviterName }: { 
  groupId: string;
  inviterName: string;
}) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId, email, inviterName }),
      });

      if (!response.ok) throw new Error('Invitation failed');
      
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${email}`,
      });
      setEmail('');
    } catch  {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send invitation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        type="email"
        placeholder="Enter email to invite"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="max-w-[300px]"
      />
      <Button onClick={handleInvite} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Invite'}
      </Button>
    </div>
  );
}