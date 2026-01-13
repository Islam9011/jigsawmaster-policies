#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Jigsaw Puzzle Game
Tests all backend endpoints systematically with realistic data
"""

import requests
import json
import time
import base64
from datetime import datetime
import uuid

# Backend URL from frontend environment
BACKEND_URL = "https://visual-word-match.preview.emergentagent.com/api"

class JigsawPuzzleAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_id = None
        self.test_puzzle_id = None
        self.results = {
            "categories": {"status": "pending", "details": ""},
            "difficulties": {"status": "pending", "details": ""},
            "ai_generation": {"status": "pending", "details": ""},
            "user_registration": {"status": "pending", "details": ""},
            "user_login": {"status": "pending", "details": ""},
            "puzzle_progress": {"status": "pending", "details": ""},
            "global_leaderboard": {"status": "pending", "details": ""},
            "category_leaderboard": {"status": "pending", "details": ""}
        }
    
    def log_result(self, test_name, status, details):
        """Log test result"""
        self.results[test_name] = {"status": status, "details": details}
        print(f"[{status.upper()}] {test_name}: {details}")
    
    def test_categories_api(self):
        """Test GET /api/puzzles/categories - should return 6 categories"""
        try:
            print("\n=== Testing Categories API ===")
            response = self.session.get(f"{BACKEND_URL}/puzzles/categories", timeout=30)
            
            if response.status_code == 200:
                categories = response.json()
                expected_categories = ["animals", "nature", "food", "objects", "vehicles", "buildings"]
                
                if len(categories) == 6:
                    category_ids = [cat["id"] for cat in categories]
                    missing = [cat for cat in expected_categories if cat not in category_ids]
                    
                    if not missing:
                        self.log_result("categories", "pass", f"All 6 categories returned: {category_ids}")
                        return True
                    else:
                        self.log_result("categories", "fail", f"Missing categories: {missing}")
                        return False
                else:
                    self.log_result("categories", "fail", f"Expected 6 categories, got {len(categories)}")
                    return False
            else:
                self.log_result("categories", "fail", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("categories", "fail", f"Exception: {str(e)}")
            return False
    
    def test_difficulties_api(self):
        """Test GET /api/puzzles/difficulties - should return difficulty levels 9-64"""
        try:
            print("\n=== Testing Difficulties API ===")
            response = self.session.get(f"{BACKEND_URL}/puzzles/difficulties", timeout=30)
            
            if response.status_code == 200:
                difficulties = response.json()
                expected_levels = [9, 16, 25, 36, 49, 64]
                
                if len(difficulties) == 6:
                    actual_levels = [diff["level"] for diff in difficulties]
                    
                    if actual_levels == expected_levels:
                        self.log_result("difficulties", "pass", f"All difficulty levels returned: {actual_levels}")
                        return True
                    else:
                        self.log_result("difficulties", "fail", f"Expected {expected_levels}, got {actual_levels}")
                        return False
                else:
                    self.log_result("difficulties", "fail", f"Expected 6 difficulties, got {len(difficulties)}")
                    return False
            else:
                self.log_result("difficulties", "fail", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("difficulties", "fail", f"Exception: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test POST /api/auth/register with realistic user data"""
        try:
            print("\n=== Testing User Registration ===")
            
            # Generate realistic user data
            timestamp = int(time.time())
            user_data = {
                "username": f"sarah_puzzle_{timestamp}",
                "email": f"sarah.johnson.{timestamp}@puzzlegame.com",
                "password": "SecurePuzzle2024!",
                "preferred_language": "en"
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/auth/register",
                json=user_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if "user_id" in result and "message" in result:
                    self.test_user_id = result["user_id"]
                    self.log_result("user_registration", "pass", f"User registered successfully: {user_data['username']}")
                    return True, user_data
                else:
                    self.log_result("user_registration", "fail", f"Missing user_id or message in response: {result}")
                    return False, None
            else:
                self.log_result("user_registration", "fail", f"HTTP {response.status_code}: {response.text}")
                return False, None
                
        except Exception as e:
            self.log_result("user_registration", "fail", f"Exception: {str(e)}")
            return False, None
    
    def test_user_login(self, user_data):
        """Test POST /api/auth/login"""
        try:
            print("\n=== Testing User Login ===")
            
            if not user_data:
                self.log_result("user_login", "skip", "No user data from registration")
                return False
            
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json=login_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if "user" in result and "message" in result:
                    user_info = result["user"]
                    if user_info["email"] == user_data["email"]:
                        self.log_result("user_login", "pass", f"Login successful for {user_data['username']}")
                        return True
                    else:
                        self.log_result("user_login", "fail", f"Email mismatch in response")
                        return False
                else:
                    self.log_result("user_login", "fail", f"Missing user or message in response: {result}")
                    return False
            else:
                self.log_result("user_login", "fail", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("user_login", "fail", f"Exception: {str(e)}")
            return False
    
    def test_ai_puzzle_generation(self):
        """Test POST /api/puzzles/generate - CRITICAL AI image generation test"""
        try:
            print("\n=== Testing AI Puzzle Generation (CRITICAL) ===")
            print("⚠️  This test may take up to 60 seconds for AI image generation...")
            
            puzzle_data = {
                "category": "animals",
                "difficulty": 9,
                "language": "en"
            }
            
            # Use extended timeout for AI generation
            response = self.session.post(
                f"{BACKEND_URL}/puzzles/generate",
                json=puzzle_data,
                timeout=90  # Extended timeout for AI generation
            )
            
            if response.status_code == 200:
                puzzle = response.json()
                
                # Verify puzzle structure
                required_fields = ["id", "title", "category", "difficulty", "image_base64", "created_at"]
                missing_fields = [field for field in required_fields if field not in puzzle]
                
                if missing_fields:
                    self.log_result("ai_generation", "fail", f"Missing fields: {missing_fields}")
                    return False
                
                # Verify base64 image data
                try:
                    image_data = base64.b64decode(puzzle["image_base64"])
                    if len(image_data) > 1000:  # Should be a substantial image
                        self.test_puzzle_id = puzzle["id"]
                        self.log_result("ai_generation", "pass", f"AI puzzle generated successfully: {puzzle['title']}, Image size: {len(image_data)} bytes")
                        return True
                    else:
                        self.log_result("ai_generation", "fail", f"Image data too small: {len(image_data)} bytes")
                        return False
                except Exception as decode_error:
                    self.log_result("ai_generation", "fail", f"Invalid base64 image data: {str(decode_error)}")
                    return False
            else:
                self.log_result("ai_generation", "fail", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            self.log_result("ai_generation", "fail", "Request timeout (>90s) - AI generation may be taking too long")
            return False
        except Exception as e:
            self.log_result("ai_generation", "fail", f"Exception: {str(e)}")
            return False
    
    def test_puzzle_progress(self):
        """Test POST /api/progress/complete"""
        try:
            print("\n=== Testing Puzzle Progress ===")
            
            if not self.test_user_id or not self.test_puzzle_id:
                self.log_result("puzzle_progress", "skip", "Missing user_id or puzzle_id from previous tests")
                return False
            
            progress_data = {
                "user_id": self.test_user_id,
                "puzzle_id": self.test_puzzle_id,
                "time_taken": 180,  # 3 minutes
                "difficulty": 9
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/progress/complete",
                json=progress_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if "score" in result and "message" in result:
                    score = result["score"]
                    if score > 0:
                        self.log_result("puzzle_progress", "pass", f"Progress recorded successfully, Score: {score}")
                        return True
                    else:
                        self.log_result("puzzle_progress", "fail", f"Invalid score: {score}")
                        return False
                else:
                    self.log_result("puzzle_progress", "fail", f"Missing score or message in response: {result}")
                    return False
            else:
                self.log_result("puzzle_progress", "fail", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("puzzle_progress", "fail", f"Exception: {str(e)}")
            return False
    
    def test_global_leaderboard(self):
        """Test GET /api/leaderboard/global"""
        try:
            print("\n=== Testing Global Leaderboard ===")
            
            response = self.session.get(f"{BACKEND_URL}/leaderboard/global", timeout=30)
            
            if response.status_code == 200:
                leaderboard = response.json()
                
                if isinstance(leaderboard, list):
                    if len(leaderboard) >= 0:  # Can be empty initially
                        # If there are entries, verify structure
                        if leaderboard:
                            entry = leaderboard[0]
                            required_fields = ["user_id", "username", "total_score", "puzzles_completed"]
                            missing_fields = [field for field in required_fields if field not in entry]
                            
                            if missing_fields:
                                self.log_result("global_leaderboard", "fail", f"Missing fields in leaderboard entry: {missing_fields}")
                                return False
                        
                        self.log_result("global_leaderboard", "pass", f"Global leaderboard returned {len(leaderboard)} entries")
                        return True
                    else:
                        self.log_result("global_leaderboard", "fail", "Leaderboard returned negative length")
                        return False
                else:
                    self.log_result("global_leaderboard", "fail", f"Expected list, got {type(leaderboard)}")
                    return False
            else:
                self.log_result("global_leaderboard", "fail", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("global_leaderboard", "fail", f"Exception: {str(e)}")
            return False
    
    def test_category_leaderboard(self):
        """Test GET /api/leaderboard/category/{category}"""
        try:
            print("\n=== Testing Category Leaderboard ===")
            
            category = "animals"
            response = self.session.get(f"{BACKEND_URL}/leaderboard/category/{category}", timeout=30)
            
            if response.status_code == 200:
                leaderboard = response.json()
                
                if isinstance(leaderboard, list):
                    if len(leaderboard) >= 0:  # Can be empty initially
                        # If there are entries, verify structure
                        if leaderboard:
                            entry = leaderboard[0]
                            required_fields = ["user_id", "username", "total_score", "puzzles_completed"]
                            missing_fields = [field for field in required_fields if field not in entry]
                            
                            if missing_fields:
                                self.log_result("category_leaderboard", "fail", f"Missing fields in category leaderboard entry: {missing_fields}")
                                return False
                        
                        self.log_result("category_leaderboard", "pass", f"Category leaderboard for '{category}' returned {len(leaderboard)} entries")
                        return True
                    else:
                        self.log_result("category_leaderboard", "fail", "Category leaderboard returned negative length")
                        return False
                else:
                    self.log_result("category_leaderboard", "fail", f"Expected list, got {type(leaderboard)}")
                    return False
            else:
                self.log_result("category_leaderboard", "fail", f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("category_leaderboard", "fail", f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests in order"""
        print("🧩 Starting Jigsaw Puzzle Game Backend API Testing")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test in priority order as specified
        test_results = {}
        
        # 1. Categories API (High Priority)
        test_results['categories'] = self.test_categories_api()
        
        # 2. Difficulties API (High Priority)  
        test_results['difficulties'] = self.test_difficulties_api()
        
        # 3. User Registration (High Priority)
        registration_success, user_data = self.test_user_registration()
        test_results['user_registration'] = registration_success
        
        # 4. User Login (High Priority)
        test_results['user_login'] = self.test_user_login(user_data)
        
        # 5. AI Puzzle Generation (CRITICAL - High Priority)
        test_results['ai_generation'] = self.test_ai_puzzle_generation()
        
        # 6. Puzzle Progress (High Priority)
        test_results['puzzle_progress'] = self.test_puzzle_progress()
        
        # 7. Global Leaderboard (High Priority)
        test_results['global_leaderboard'] = self.test_global_leaderboard()
        
        # 8. Category Leaderboard (High Priority)
        test_results['category_leaderboard'] = self.test_category_leaderboard()
        
        # Print summary
        self.print_summary(test_results)
        
        return test_results
    
    def print_summary(self, test_results):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🧩 JIGSAW PUZZLE GAME BACKEND TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            details = self.results[test_name]["details"]
            print(f"{status} {test_name.replace('_', ' ').title()}: {details}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All backend APIs are working correctly!")
        else:
            print("⚠️  Some backend APIs need attention")

if __name__ == "__main__":
    tester = JigsawPuzzleAPITester()
    results = tester.run_all_tests()