from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date

from .models import Income, Expense, Budget, Notification,SavingsGoal


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

    def test_download_monthly_report_pdf(self):
        create_response = self.client.post(
            "/api/reports/",
            {
                "month": "2026-09"
            },
            format="json"
        )
        self.assertEqual(create_response.status_code, 201)
        report_id = create_response.data["report"]["id"]

        response = self.client.get(f"/api/reports/{report_id}/pdf/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("BudgetBuddy_2026-09.pdf", response["Content-Disposition"])
        self.assertGreater(len(response.content), 0)
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_pdf_report_user_isolation(self):
        create_response = self.client.post(
            "/api/reports/",
            {
                "month": "2026-09"
            },
            format="json"
        )
        self.assertEqual(create_response.status_code, 201)
        report_id = create_response.data["report"]["id"]

        other_user = User.objects.create_user(
            username="otherpdfuser",
            email="otherpdfuser@example.com",
            password="Test@12345"
        )
        refresh = RefreshToken.for_user(other_user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        response = self.client.get(f"/api/reports/{report_id}/pdf/")
        self.assertEqual(response.status_code, 404)

    def test_unauthenticated_pdf_request(self):
        client = APIClient()
        response = client.get("/api/reports/1/pdf/")
        self.assertEqual(response.status_code, 401)


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

    def test_single_expense_event_creates_exactly_one_notification(self):
        response = self.client.post(
            "/api/expense/",
            {
                "title": "Single Alert Test Food",
                "amount": 4200,
                "category": "Food",
                "expense_date": "2026-09-10",
                "description": "Triggers alert once"
            },
            format="json"
        )
        self.assertEqual(response.status_code, 201)

        user_notifications = Notification.objects.filter(user=self.user)
        self.assertEqual(user_notifications.count(), 1)

        notification = user_notifications.first()
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.notification_type, "Budget Near Limit Alert")
        self.assertIn("Food", notification.message)

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

    def test_september_budget_alert_trigger(self):
        # Create a September Travel budget of ₹2000
        Budget.objects.create(
            user=self.user,
            amount=2000,
            category="Travel",
            period="September"
        )

        # Post a September Travel expense reaching 100% (₹2000)
        response = self.client.post(
            "/api/expense/",
            {
                "title": "Bus Pass",
                "amount": 2000,
                "category": "Travel",
                "expense_date": "2026-09-15",
                "description": "Monthly pass"
            },
            format="json"
        )
        self.assertEqual(response.status_code, 201)

        notification = Notification.objects.filter(
            user=self.user,
            notification_type="Budget Limit Alert",
            message__contains="Travel"
        ).first()
        self.assertIsNotNone(notification)

    def test_different_category_does_not_trigger_wrong_budget(self):
        # Create a September Shopping budget of ₹10000
        Budget.objects.create(
            user=self.user,
            amount=10000,
            category="Shopping",
            period="September"
        )

        # Post an Education expense of ₹9000 (different category)
        response = self.client.post(
            "/api/expense/",
            {
                "title": "Books",
                "amount": 9000,
                "category": "Education",
                "expense_date": "2026-09-15",
                "description": "College textbooks"
            },
            format="json"
        )
        self.assertEqual(response.status_code, 201)

        # Education should NOT have an alert
        education_notification = Notification.objects.filter(
            user=self.user,
            message__contains="Education"
        ).first()
        self.assertIsNone(education_notification)


class BudgetCRUDAPITestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="budgetcruduser",
            email="budgetcruduser@example.com",
            password="Test@12345"
        )
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        self.budget = Budget.objects.create(
            user=self.user,
            amount=5000,
            category="Food",
            period="Monthly"
        )

    def test_budget_put_success(self):
        response = self.client.put(
            f"/api/budget/{self.budget.id}/",
            {
                "amount": 7500,
                "category": "Food",
                "period": "Monthly"
            },
            format="json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(float(data["amount"]), 7500.0)

        self.budget.refresh_from_db()
        self.assertEqual(float(self.budget.amount), 7500.0)

    def test_budget_delete_success(self):
        response = self.client.delete(f"/api/budget/{self.budget.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Budget.objects.filter(id=self.budget.id).exists())

    def test_cross_user_put_protection(self):
        other_user = User.objects.create_user(
            username="otherbudgetcruduser",
            email="otherbudgetcrud@example.com",
            password="Test@12345"
        )
        other_client = APIClient()
        refresh = RefreshToken.for_user(other_user)
        other_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        response = other_client.put(
            f"/api/budget/{self.budget.id}/",
            {
                "amount": 10000
            },
            format="json"
        )
        self.assertEqual(response.status_code, 404)

        self.budget.refresh_from_db()
        self.assertEqual(float(self.budget.amount), 5000.0)

    def test_cross_user_delete_protection(self):
        other_user = User.objects.create_user(
            username="otherbudgetcruduser2",
            email="otherbudgetcrud2@example.com",
            password="Test@12345"
        )
        other_client = APIClient()
        refresh = RefreshToken.for_user(other_user)
        other_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

        response = other_client.delete(f"/api/budget/{self.budget.id}/")
        self.assertEqual(response.status_code, 404)

        self.assertTrue(Budget.objects.filter(id=self.budget.id).exists())

    def test_unauthenticated_put_delete(self):
        anonymous_client = APIClient()
        put_response = anonymous_client.put(
            f"/api/budget/{self.budget.id}/",
            {"amount": 8000},
            format="json"
        )
        self.assertEqual(put_response.status_code, 401)

        del_response = anonymous_client.delete(f"/api/budget/{self.budget.id}/")
        self.assertEqual(del_response.status_code, 401)


class SavingsGoalAPITestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="savingsgoaltest",
            email="savingsgoaltest@example.com",
            password="Test@12345"
        )

        self.client = APIClient()

        refresh = RefreshToken.for_user(self.user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

    def test_savings_goal_milestone_duplicate_prevention(self):
        goal = SavingsGoal.objects.create(
            user=self.user,
            goal_name="Duplicate Test Goal",
            target_amount=1000,
            current_amount=0
        )

        # First update reaches the target
        response1 = self.client.put(
            f"/api/savings-goal/{goal.id}/",
            {
                "current_amount": 1000
            },
            format="json"
        )

        self.assertEqual(response1.status_code, 200)

        # Second update keeps the goal at the target
        response2 = self.client.put(
            f"/api/savings-goal/{goal.id}/",
            {
                "current_amount": 1000
            },
            format="json"
        )

        self.assertEqual(response2.status_code, 200)

        notifications = Notification.objects.filter(
            user=self.user,
            notification_type="Savings Goal Milestone",
            message__contains=f"Goal ID: {goal.id}"
        )

        # Only one milestone notification should exist
        self.assertEqual(notifications.count(), 1)


class ProfileAPITestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="profiletestuser",
            email="profiletestuser@example.com",
            password="Test@12345",
            role="student"
        )
        self.client = APIClient()
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}"
        )

    def test_get_profile_authenticated(self):
        response = self.client.get("/api/profile/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["username"], "profiletestuser")
        self.assertEqual(data["email"], "profiletestuser@example.com")
        self.assertEqual(data["role"], "student")

    def test_put_profile_update(self):
        response = self.client.put(
            "/api/profile/",
            {
                "username": "updatedprofileuser",
                "email": "updatedprofileuser@example.com",
                "monthly_income": 35000,
                "financial_preferences": "Save for emergency fund"
            },
            format="json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["username"], "updatedprofileuser")
        self.assertEqual(data["email"], "updatedprofileuser@example.com")
        self.assertEqual(float(data["monthly_income"]), 35000.0)
        self.assertEqual(data["financial_preferences"], "Save for emergency fund")

    def test_negative_monthly_income_rejected(self):
        response = self.client.put(
            "/api/profile/",
            {
                "monthly_income": -5000
            },
            format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_role_cannot_be_updated_via_put(self):
        response = self.client.put(
            "/api/profile/",
            {
                "role": "admin"
            },
            format="json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["role"], "student")

    def test_unauthenticated_profile_request_rejected(self):
        client = APIClient()
        response = client.get("/api/profile/")
        self.assertEqual(response.status_code, 401)


class RegistrationSecurityAPITestCase(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_normal_registration_creates_student(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "newstudentuser",
                "email": "newstudent@example.com",
                "password": "Password@123"
            },
            format="json"
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="newstudentuser")
        self.assertEqual(user.role, "student")

    def test_registration_with_admin_role_ignored(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "attemptedadminuser",
                "email": "attemptedadmin@example.com",
                "password": "Password@123",
                "role": "admin"
            },
            format="json"
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="attemptedadminuser")
        self.assertEqual(user.role, "student")

    def test_registration_with_premium_role_ignored(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "attemptedpremiumuser",
                "email": "attemptedpremium@example.com",
                "password": "Password@123",
                "role": "premium"
            },
            format="json"
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="attemptedpremiumuser")
        self.assertEqual(user.role, "student")