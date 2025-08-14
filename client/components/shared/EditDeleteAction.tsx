'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import apiService from '@/services/apiservices';
import { toast } from '../ui/use-toast';

interface Props {
  type: string;
  itemId: string;
}

const EditDeleteAction = ({ type, itemId }: Props) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/question/edit/${itemId}`);
  };

  const handleDelete = async () => {
    try {
      if (type.toLowerCase() === 'question') {
        await apiService.delete(`/api/questions/${itemId}/`);
        toast({
          title: 'Question deleted successfully',
          variant: 'default'
        });
      }

      if (type.toLowerCase() === 'answer') {
        await apiService.delete(`/api/answers/${itemId}/`);
        toast({
          title: 'Answer deleted successfully',
          variant: 'default'
        });
      }
      
      router.refresh();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex items-center justify-end gap-3 max-sm:w-full">
      {type.toLowerCase() === 'question' && (
        <Image
          src="/assets/icons/edit.svg"
          alt="edit"
          width={14}
          height={14}
          className="cursor-pointer object-contain"
          onClick={handleEdit}
        />
      )}

      <Image
        src="/assets/icons/trash.svg"
        alt="delete"
        width={14}
        height={14}
        className="cursor-pointer object-contain"
        onClick={handleDelete}
      />
    </div>
  );
};
export default EditDeleteAction;
