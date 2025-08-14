from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from questions.models import Question


@receiver(m2m_changed, sender=Question.tags.through)
def update_tag_question_count(sender, instance, action, pk_set, **kwargs):
    """
    Update question count for tags when questions are tagged/untagged
    """
    if action in ['post_add', 'post_remove']:
        from tags.models import Tag
        
        if pk_set:
            for tag_id in pk_set:
                try:
                    tag = Tag.objects.get(pk=tag_id)
                    tag.question_count = tag.questions.count()
                    tag.save(update_fields=['question_count'])
                except Tag.DoesNotExist:
                    pass
