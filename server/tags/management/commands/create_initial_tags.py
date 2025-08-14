from django.core.management.base import BaseCommand
from tags.models import Tag


class Command(BaseCommand):
    help = 'Create initial tag data'

    def handle(self, *args, **options):
        # Popular programming tags
        tags_data = [
            {'name': 'JavaScript', 'description': 'A high-level programming language', 'color': '#F7DF1E'},
            {'name': 'Python', 'description': 'A powerful programming language', 'color': '#3776AB'},
            {'name': 'React', 'description': 'A JavaScript library for building user interfaces', 'color': '#61DAFB'},
            {'name': 'Django', 'description': 'A high-level Python web framework', 'color': '#092E20'},
            {'name': 'Node.js', 'description': 'JavaScript runtime built on Chrome V8 engine', 'color': '#339933'},
            {'name': 'TypeScript', 'description': 'A typed superset of JavaScript', 'color': '#3178C6'},
            {'name': 'HTML', 'description': 'The standard markup language for documents', 'color': '#E34F26'},
            {'name': 'CSS', 'description': 'A style sheet language for web pages', 'color': '#1572B6'},
            {'name': 'Java', 'description': 'A class-based, object-oriented programming language', 'color': '#ED8B00'},
            {'name': 'Next.js', 'description': 'A React framework for production', 'color': '#000000'},
            {'name': 'MongoDB', 'description': 'A NoSQL document database', 'color': '#47A248'},
            {'name': 'MySQL', 'description': 'An open-source relational database', 'color': '#4479A1'},
        ]

        for tag_data in tags_data:
            tag, created = Tag.objects.get_or_create(
                name=tag_data['name'],
                defaults={
                    'description': tag_data['description'],
                    'color': tag_data['color'],
                    'question_count': 0
                }
            )
            if created:
                self.stdout.write(f"Created tag: {tag.name}")
            else:
                self.stdout.write(f"Tag already exists: {tag.name}")

        self.stdout.write(self.style.SUCCESS('Successfully created initial tags'))
