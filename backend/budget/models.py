from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    email = models.EmailField(unique=True)

    ROLE_CHOICES = (
        ('student', 'Student'),
        ('premium', 'Premium User'),
        ('admin', 'Admin'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student'
    )
    
    
class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    monthly_income = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )

    financial_preferences = models.TextField(
        blank=True
    )

    def __str__(self):
        return f"{self.user.username}'s Profile"
    

class Income(models.Model):
    SOURCE_CHOICES = (
        ('Pocket Money', 'Pocket Money'),
        ('Scholarship', 'Scholarship'),
        ('Freelance Income', 'Freelance Income'),
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='incomes'
    )
    
    source = models.CharField(max_length=100, choices=SOURCE_CHOICES)

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )

    income_date = models.DateField()

    description = models.TextField(
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.source} - {self.amount}"

class Expense(models.Model):

    CATEGORY_CHOICES = (
        ('Food', 'Food'),
        ('Travel', 'Travel'),
        ('Shopping', 'Shopping'),
        ('Education', 'Education'),
        ('Entertainment', 'Entertainment'),
        ('Miscellaneous', 'Miscellaneous'),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expenses'
    )

    title = models.CharField(max_length=200)

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )

    category = models.CharField(
        max_length=100,
        choices=CATEGORY_CHOICES
    )

    expense_date = models.DateField()

    description = models.TextField(
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.title} - {self.amount}"
    
    def __str__(self):
        return f"{self.title} - {self.amount}"
    
    
class Budget(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='budgets'
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )

    category = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    period = models.CharField(
        max_length=50
    )

    def __str__(self):
        return f"{self.user.username} - {self.amount}"
    
    
class SavingsGoal(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='savings_goals'
    )

    goal_name = models.CharField(max_length=200)

    target_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )

    current_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    target_date = models.DateField(
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.goal_name} - {self.target_amount}"
    

class Notification(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    message = models.TextField()

    notification_type = models.CharField(
        max_length=100
    )

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.notification_type}"
    
    
class Report(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reports'
    )

    report_type = models.CharField(
        max_length=100
    )

    period = models.CharField(
        max_length=100
    )

    generated_at = models.DateTimeField(
        auto_now_add=True
    )

    file_reference = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.report_type}"
