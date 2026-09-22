from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date

from .models import Income, Expense, Budget, Notification


User = get_user_model()


class AnalyticsAPITestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="analyticstest",
            email="analyticstest@example.com",
            password="Test@12345"
        )

        self.client = APIClient()

        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        # Test income
        Income.objects.create(
            user=self.user,
            source="Pocket Money",
            amount=1000,
            income_date=date(2026, 9, 5),
            description="Monthly pocket money"
        )

        Income.objects.create(
            user=self.user,
            source="Freelance Income",
            amount=500,
            income_date=date(2026, 9, 10),
            description="Freelance work"
        )

        # Test expenses
        Expense.objects.create(
            user=self.user,
            title="Lunch",
            amount=200,
            category="Food",
            expense_date=date(2026, 9, 6),
            description="College lunch"
        )

        Expense.objects.create(
            user=self.user,
            title="Bus",
            amount=300,
            category="Travel",
            expense_date=date(2026, 9, 8),
            description="Bus travel"
        )

        Expense.objects.create(
            user=self.user,
            title="Books",
            amount=500,
            category="Education",
            expense_date=date(2026, 9, 12),
            description="Study books"
        )

    def test_analytics_summary(self):
        response = self.client.get("/api/analytics/")

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(data["summary"]["total_income"], 1500.0)
        self.assertEqual(data["summary"]["total_expenses"], 1000.0)
        self.assertEqual(data["summary"]["savings"], 500.0)

    def test_category_wise_expenses(self):
        response = self.client.get("/api/analytics/")

        self.assertEqual(response.status_code, 200)

        data = response.json()

        categories = {
            item["category"]: item["total"]
            for item in data["category_wise_expenses"]
        }

        self.assertEqual(categories["Food"], 200.0)
        self.assertEqual(categories["Travel"], 300.0)
        self.assertEqual(categories["Education"], 500.0)

    def test_monthly_trends(self):
        response = self.client.get("/api/analytics/")

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(
            data["monthly_trends"]["income"][0]["month"],
            "2026-09"
        )

        self.assertEqual(
            data["monthly_trends"]["income"][0]["total"],
            1500.0
        )

        self.assertEqual(
            data["monthly_trends"]["expenses"][0]["month"],
            "2026-09"
        )

        self.assertEqual(
            data["monthly_trends"]["expenses"][0]["total"],
            1000.0
        )

    def test_month_filter(self):
        response = self.client.get(
            "/api/analytics/?month=2026-09"
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()

        self.assertEqual(data["summary"]["total_income"], 1500.0)
        self.assertEqual(data["summary"]["total_expenses"], 1000.0)
        self.assertEqual(data["summary"]["savings"], 500.0)

    def test_invalid_month(self):
        response = self.client.get(
            "/api/analytics/?month=2026-13"
        )

        self.assertEqual(response.status_code, 400)

        data = response.json()

        self.assertEqual(
            data["error"],
            "Invalid month format. Use YYYY-MM."
        )
        
        
class ReportAPITestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="reporttest",
            email="reporttest@example.com",
            password="Test@12345"
        )

        self.client = APIClient()

        refresh = RefreshToken.for_user(self.user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        # Test income
        Income.objects.create(
            user=self.user,
            source="Pocket Money",
            amount=2000,
            income_date=date(2026, 9, 5),
            description="September income"
        )

        # Test expenses
        Expense.objects.create(
            user=self.user,
            title="Food",
            amount=500,
            category="Food",
            expense_date=date(2026, 9, 10),
            description="September food"
        )

        # Test budget
        Budget.objects.create(
            user=self.user,
            amount=5000,
            category="Food",
            period="Monthly"
        )

    def test_generate_monthly_report(self):
        response = self.client.post(
            "/api/reports/",
            {
                "month": "2026-09"
            },
            format="json"
        )

        self.assertEqual(response.status_code, 201)

        data = response.json()

        self.assertEqual(
            data["message"],
            "Monthly report generated successfully."
        )

        self.assertEqual(
            data["report"]["report_type"],
            "Monthly Financial Report"
        )

        self.assertEqual(
            data["report"]["period"],
            "2026-09"
        )

        self.assertEqual(
            data["report"]["summary"]["total_income"],
            2000.0
        )

        self.assertEqual(
            data["report"]["summary"]["total_expenses"],
            500.0
        )

        self.assertEqual(
            data["report"]["summary"]["savings"],
            1500.0
        )

    def test_invalid_report_month(self):
        response = self.client.post(
            "/api/reports/",
            {
                "month": "2026-13"
            },
            format="json"
        )

        self.assertEqual(response.status_code, 400)

        data = response.json()

        self.assertEqual(
            data["error"],
            "Invalid month format. Use YYYY-MM."
        )

    def test_missing_report_month(self):
        response = self.client.post(
            "/api/reports/",
            {},
            format="json"
        )

        self.assertEqual(response.status_code, 400)

        data = response.json()

        self.assertEqual(
            data["error"],
            "Month is required. Use YYYY-MM."
        )

    def test_get_user_reports(self):
        # Generate a report first
        create_response = self.client.post(
            "/api/reports/",
            {
                "month": "2026-09"
            },
            format="json"
        )

        self.assertEqual(
            create_response.status_code,
            201
        )

        # Retrieve reports
        response = self.client.get(
            "/api/reports/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        data = response.json()

        self.assertEqual(
            len(data),
            1
        )

        self.assertEqual(
            data[0]["report_type"],
            "Monthly Financial Report"
        )

        self.assertEqual(
            data[0]["period"],
            "2026-09"
        )

        self.assertEqual(
            data[0]["summary"]["total_income"],
            2000.0
        )

        self.assertEqual(
            data[0]["summary"]["total_expenses"],
            500.0
        )

        self.assertEqual(
            data[0]["summary"]["savings"],
            1500.0
        )

    def test_download_monthly_report_excel(self):
        # Create a monthly report first
        create_response = self.client.post(
            "/api/reports/",
            {
                "month": "2026-09"
            },
            format="json"
        )

        self.assertEqual(
            create_response.status_code,
            201
        )

        report_id = create_response.data["report"]["id"]

        # Download Excel report
        response = self.client.get(
            f"/api/reports/{report_id}/excel/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        # Check Excel content type
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        # Check download filename
        self.assertIn(
            "BudgetBuddy_2026-09.xlsx",
            response["Content-Disposition"]
        )

        # Check that some Excel data was returned
        self.assertGreater(
            len(response.content),
            0
        )
        
        
    def test_excel_report_user_isolation(self):
        # Create a report for User 1
        create_response = self.client.post(
            "/api/reports/",
            {
                "month": "2026-09"
            },
            format="json"
        )

        self.assertEqual(
            create_response.status_code,
            201
        )

        report_id = create_response.data["report"]["id"]

        # Create another user
        other_user = User.objects.create_user(
            username="otherreportuser",
            email="otherreportuser@example.com",
            password="Test@12345"
        )

        # Authenticate as the other user
        refresh = RefreshToken.for_user(other_user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        # Try to download User 1's report
        response = self.client.get(
            f"/api/reports/{report_id}/excel/"
        )

        # Other user must not be allowed to access it
        self.assertEqual(
            response.status_code,
            404
        )
        
        
class BudgetAlertAPITestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="budgetalerttest",
            email="budgetalerttest@example.com",
            password="Test@12345"
        )

        self.client = APIClient()

        refresh = RefreshToken.for_user(self.user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        # Create a monthly Food budget of ₹5000
        Budget.objects.create(
            user=self.user,
            amount=5000,
            category="Food",
            period="Monthly"
        )

    def test_budget_below_80_percent_no_alert(self):
        response = self.client.post(
            "/api/expense/",
            {
                "title": "Lunch",
                "amount": 1000,
                "category": "Food",
                "expense_date": "2026-09-10",
                "description": "College lunch"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            201
        )

        # ₹1000 / ₹5000 = 20%
        notification_count = Notification.objects.filter(
            user=self.user
        ).count()

        self.assertEqual(
            notification_count,
            0
        )  
        
    def test_budget_near_limit_alert(self):
        response = self.client.post(
            "/api/expense/",
            {
                "title": "Food",
                "amount": 4000,
                "category": "Food",
                "expense_date": "2026-09-10",
                "description": "Food expenses"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            201
        )

        # ₹4000 / ₹5000 = 80%
        notification = Notification.objects.filter(
            user=self.user,
            notification_type="Budget Near Limit Alert"
        ).first()

        self.assertIsNotNone(notification)

        self.assertIn(
            "Food",
            notification.message
        )  
    
    def test_budget_limit_alert(self):
        response = self.client.post(
            "/api/expense/",
            {
                "title": "Food",
                "amount": 5000,
                "category": "Food",
                "expense_date": "2026-09-10",
                "description": "Food expenses"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            201
        )

        # ₹5000 / ₹5000 = 100%
        notification = Notification.objects.filter(
            user=self.user,
            notification_type="Budget Limit Alert"
        ).first()

        self.assertIsNotNone(notification)

        self.assertIn(
            "Food",
            notification.message
        )
        
      
      
    def test_budget_alert_duplicate_prevention(self):
        # First expense reaches 80%
        response1 = self.client.post(
            "/api/expense/",
            {
                "title": "Food 1",
                "amount": 4000,
                "category": "Food",
                "expense_date": "2026-09-10",
                "description": "First food expense"
            },
            format="json"
        )

        self.assertEqual(
            response1.status_code,
            201
        )

        # Second expense increases spending to 90%
        response2 = self.client.post(
            "/api/expense/",
            {
                "title": "Food 2",
                "amount": 500,
                "category": "Food",
                "expense_date": "2026-09-11",
                "description": "Second food expense"
            },
            format="json"
        )

        self.assertEqual(
            response2.status_code,
            201
        )

        # Only one Near Limit Alert should exist
        notification_count = Notification.objects.filter(
            user=self.user,
            notification_type="Budget Near Limit Alert"
        ).count()

        self.assertEqual(
            notification_count,
            1
        )  
        
        
    def test_budget_alert_user_isolation(self):
        # User 1 reaches 80% of the Food budget
        response = self.client.post(
            "/api/expense/",
            {
                "title": "Food",
                "amount": 4000,
                "category": "Food",
                "expense_date": "2026-09-10",
                "description": "User 1 food expense"
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            201
        )

        # Confirm User 1 has the alert
        user1_notification_count = Notification.objects.filter(
            user=self.user,
            notification_type="Budget Near Limit Alert"
        ).count()

        self.assertEqual(
            user1_notification_count,
            1
        )

        # Create User 2
        other_user = User.objects.create_user(
            username="otherbudgetuser",
            email="otherbudgetuser@example.com",
            password="Test@12345"
        )

        # Authenticate as User 2
        refresh = RefreshToken.for_user(other_user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        # User 2 checks notifications
        response = self.client.get(
            "/api/notifications/"
        )

        self.assertEqual(
            response.status_code,
            200
        )

        data = response.json()

        # User 2 must not see User 1's alert
        self.assertEqual(
            len(data),
            0
        )
    
    