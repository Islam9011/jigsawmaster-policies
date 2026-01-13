from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import List, Optional
import os
import logging
import base64
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize AI Image Generation
image_gen = OpenAIImageGeneration(api_key=os.environ['EMERGENT_LLM_KEY'])

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_score: int = 0
    puzzles_completed: int = 0
    preferred_language: str = "en"

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    preferred_language: str = "en"

class UserLogin(BaseModel):
    email: str
    password: str

class Puzzle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    difficulty: int  # 9, 16, 25, 36, 49, 64, 81, 100
    image_base64: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    language: str = "en"

class PuzzleCreate(BaseModel):
    category: str
    difficulty: int
    language: str = "en"

class UserProgress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    puzzle_id: str
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    time_taken: int  # seconds
    score: int
    difficulty: int

class UserProgressCreate(BaseModel):
    user_id: str
    puzzle_id: str
    time_taken: int  # seconds
    difficulty: int

class LeaderboardEntry(BaseModel):
    user_id: str
    username: str
    total_score: int
    puzzles_completed: int
    average_time: float

# Auth endpoints
@api_router.post("/auth/register", response_model=dict)
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    
    return {"message": "User created successfully", "user_id": user.id}

@api_router.post("/auth/login", response_model=dict)
async def login_user(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email, "password": login_data.password})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "user": user}

# Puzzle endpoints
@api_router.get("/puzzles/categories")
async def get_categories():
    categories = [
        {"id": "animals", "name": "Animals", "icon": "🐾"},
        {"id": "nature", "name": "Nature", "icon": "🌿"},
        {"id": "food", "name": "Food", "icon": "🍎"},
        {"id": "objects", "name": "Objects", "icon": "📱"},
        {"id": "vehicles", "name": "Vehicles", "icon": "🚗"},
        {"id": "buildings", "name": "Buildings", "icon": "🏢"},
    ]
    return categories

@api_router.get("/puzzles/difficulties")
async def get_difficulties():
    difficulties = [
        {"level": 9, "name": "Easy", "pieces": "3x3"},
        {"level": 16, "name": "Normal", "pieces": "4x4"},
        {"level": 25, "name": "Hard", "pieces": "5x5"},
        {"level": 36, "name": "Expert", "pieces": "6x6"},
        {"level": 49, "name": "Master", "pieces": "7x7"},
        {"level": 64, "name": "Extreme", "pieces": "8x8"},
    ]
    return difficulties

@api_router.post("/puzzles/generate", response_model=Puzzle)
async def generate_puzzle(puzzle_data: PuzzleCreate):
    try:
        # Category-specific prompts
        prompts = {
            "animals": f"A beautiful, clear photo of a cute animal in its natural habitat, perfect for a jigsaw puzzle",
            "nature": f"A stunning landscape or nature scene with vibrant colors, perfect for a jigsaw puzzle",
            "food": f"A delicious, colorful food item or meal that looks appetizing, perfect for a jigsaw puzzle",
            "objects": f"A common everyday object with clear details and good lighting, perfect for a jigsaw puzzle",
            "vehicles": f"A cool vehicle like a car, plane, or boat with clear details, perfect for a jigsaw puzzle",
            "buildings": f"An interesting building or architectural structure with clear details, perfect for a jigsaw puzzle"
        }
        
        prompt = prompts.get(puzzle_data.category, "A beautiful, detailed image perfect for a jigsaw puzzle")
        
        # Generate image using AI
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if not images or len(images) == 0:
            raise HTTPException(status_code=500, detail="Failed to generate image")
        
        # Convert to base64
        image_base64 = base64.b64encode(images[0]).decode('utf-8')
        
        # Create puzzle
        puzzle = Puzzle(
            title=f"{puzzle_data.category.title()} Puzzle",
            category=puzzle_data.category,
            difficulty=puzzle_data.difficulty,
            image_base64=image_base64,
            language=puzzle_data.language
        )
        
        # Save to database
        await db.puzzles.insert_one(puzzle.dict())
        
        return puzzle
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating puzzle: {str(e)}")

@api_router.get("/puzzles", response_model=List[Puzzle])
async def get_puzzles(category: Optional[str] = None, difficulty: Optional[int] = None, limit: int = 20):
    query = {}
    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty
    
    puzzles = await db.puzzles.find(query).limit(limit).to_list(1000)
    return [Puzzle(**puzzle) for puzzle in puzzles]

@api_router.get("/puzzles/{puzzle_id}", response_model=Puzzle)
async def get_puzzle(puzzle_id: str):
    puzzle = await db.puzzles.find_one({"id": puzzle_id})
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return Puzzle(**puzzle)

# Progress endpoints
@api_router.post("/progress/complete", response_model=dict)
async def complete_puzzle(progress_data: UserProgressCreate):
    # Calculate score based on difficulty and time
    base_score = progress_data.difficulty * 10
    time_bonus = max(0, 300 - progress_data.time_taken)  # Bonus for completing quickly
    total_score = base_score + time_bonus
    
    # Create full progress object
    progress = UserProgress(
        user_id=progress_data.user_id,
        puzzle_id=progress_data.puzzle_id,
        time_taken=progress_data.time_taken,
        difficulty=progress_data.difficulty,
        score=total_score
    )
    
    # Save progress
    await db.user_progress.insert_one(progress.dict())
    
    # Update user stats
    await db.users.update_one(
        {"id": progress_data.user_id},
        {
            "$inc": {
                "total_score": total_score,
                "puzzles_completed": 1
            }
        }
    )
    
    return {"message": "Puzzle completed!", "score": total_score}

@api_router.get("/progress/user/{user_id}")
async def get_user_progress(user_id: str):
    progress = await db.user_progress.find({"user_id": user_id}).to_list(1000)
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user": user,
        "progress": progress,
        "total_score": user.get("total_score", 0),
        "puzzles_completed": user.get("puzzles_completed", 0)
    }

# Leaderboard endpoints
@api_router.get("/leaderboard/global", response_model=List[LeaderboardEntry])
async def get_global_leaderboard(limit: int = 50):
    pipeline = [
        {
            "$lookup": {
                "from": "user_progress",
                "localField": "id",
                "foreignField": "user_id",
                "as": "progress"
            }
        },
        {
            "$addFields": {
                "average_time": {
                    "$cond": {
                        "if": {"$gt": [{"$size": "$progress"}, 0]},
                        "then": {"$avg": "$progress.time_taken"},
                        "else": 0
                    }
                }
            }
        },
        {
            "$sort": {"total_score": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    users = await db.users.aggregate(pipeline).to_list(1000)
    
    leaderboard = []
    for user in users:
        entry = LeaderboardEntry(
            user_id=user["id"],
            username=user["username"],
            total_score=user.get("total_score", 0),
            puzzles_completed=user.get("puzzles_completed", 0),
            average_time=user.get("average_time", 0)
        )
        leaderboard.append(entry)
    
    return leaderboard

@api_router.get("/leaderboard/category/{category}", response_model=List[LeaderboardEntry])
async def get_category_leaderboard(category: str, limit: int = 50):
    pipeline = [
        {
            "$lookup": {
                "from": "user_progress",
                "localField": "id",
                "foreignField": "user_id",
                "as": "progress"
            }
        },
        {
            "$lookup": {
                "from": "puzzles",
                "localField": "progress.puzzle_id",
                "foreignField": "id",
                "as": "puzzles"
            }
        },
        {
            "$match": {
                "puzzles.category": category
            }
        },
        {
            "$addFields": {
                "category_score": {
                    "$sum": {
                        "$map": {
                            "input": "$progress",
                            "as": "p",
                            "in": {
                                "$cond": {
                                    "if": {"$in": ["$$p.puzzle_id", "$puzzles.id"]},
                                    "then": "$$p.score",
                                    "else": 0
                                }
                            }
                        }
                    }
                },
                "category_completed": {
                    "$size": {
                        "$filter": {
                            "input": "$progress",
                            "cond": {"$in": ["$$this.puzzle_id", "$puzzles.id"]}
                        }
                    }
                }
            }
        },
        {
            "$sort": {"category_score": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    users = await db.users.aggregate(pipeline).to_list(1000)
    
    leaderboard = []
    for user in users:
        entry = LeaderboardEntry(
            user_id=user["id"],
            username=user["username"],
            total_score=user.get("category_score", 0),
            puzzles_completed=user.get("category_completed", 0),
            average_time=0  # Can be calculated if needed
        )
        leaderboard.append(entry)
    
    return leaderboard

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
