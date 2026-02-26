// 1. Import Firebase from Google's Servers
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBvx5u1OGwS6YAvmVhBF9bstiUn-Vp6TVY",
  authDomain: "corporate-extraction.firebaseapp.com",
  projectId: "corporate-extraction",
  storageBucket: "corporate-extraction.firebasestorage.app",
  messagingSenderId: "184892788723",
  appId: "1:184892788723:web:93959fe24c883a27088c86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Ensure you have these Firestore functions imported at the top of your file alongside your existing imports:
// import { getFirestore, doc, onSnapshot, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const healthText = document.getElementById('health-text');
const healthBar = document.getElementById('health-bar');
const timerText = document.getElementById('timer-text');
const lootText = document.getElementById('loot-text');
const attackBtn = document.getElementById('attack-btn');
const extractBtn = document.getElementById('extract-btn');

// Local Player State
let localLoot = 0;
let hasExtracted = false;
const maxHealth = 10000;

// Reference to the boss document in your existing Firestore database
// (Assumes you have a collection called "gameData" and a document called "boss")
const bossRef = doc(db, "gameData", "boss");

// 1. Update UI Function
function updateUI(currentHealth) {
    healthText.innerText = currentHealth;
    const healthPercentage = (currentHealth / maxHealth) * 100;
    healthBar.style.width = `${Math.max(0, healthPercentage)}%`;
}

// 2. Real-Time Sync: Listen to the Boss's Health
onSnapshot(bossRef, (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        updateUI(data.health);
        
        // Optional: Handle boss defeat
        if (data.health <= 0) {
            attackBtn.disabled = true;
            attackBtn.innerText = "Boss Defeated!";
        }
    }
});

// 3. Attack Logic (Work)
attackBtn.addEventListener('click', async () => {
    if (hasExtracted) return; // Can't work if clocked out

    // Increase player's local salary (loot)
    localLoot += 10;
    lootText.innerText = localLoot;

    // Push damage to Firebase
    try {
        await updateDoc(bossRef, {
            health: increment(-10) // Subtracts 10 from the boss's current health
        });
    } catch (error) {
        console.error("Error updating boss health: ", error);
    }
});

// 4. Extract Logic (Clock Out)
extractBtn.addEventListener('click', () => {
    if (hasExtracted) return;
    
    hasExtracted = true;
    attackBtn.disabled = true;
    extractBtn.innerText = "Successfully Clocked Out";
    
    alert(`Extraction successful! You secured $${localLoot} in salary.`);
});

// 4. Game Variables & HTML Elements
let myLootCount = 0;
let hasExtracted = false;

const bossHealthEl = document.getElementById('boss-health');
const timerEl = document.getElementById('timer');
const attackBtn = document.getElementById('attack-btn');
const extractBtn = document.getElementById('extract-btn');
const lootCountEl = document.getElementById('loot-count');

// Database Locations (where the data lives in Firebase)
const bossHealthRef = ref(db, 'raid/bossHealth');
const timerRef = ref(db, 'raid/timer');

// 5. SYNC: Listen for Global Boss Health Changes
onValue(bossHealthRef, (snapshot) => {
    const health = snapshot.val();
    if (health !== null) {
        bossHealthEl.innerText = `${health}%`;
        
        if (health <= 0) {
            bossHealthEl.innerText = "DEFEATED";
            attackBtn.disabled = true;
        }
    }
});

// 6. SYNC: Listen for Global Timer Changes
onValue(timerRef, (snapshot) => {
    const time = snapshot.val();
    if (time !== null) {
        // Format seconds into MM:SS
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // The Server Wipe Event
        if (time <= 0) {
            timerEl.innerText = "WIPE";
            attackBtn.disabled = true;
            
            if (!hasExtracted) {
                alert("YOU MISSED THE ELEVATOR. ALL LOOT LOST.");
                myLootCount = 0;
                lootCountEl.innerText = myLootCount;
            }
        }
    }
});

// 7. ACTION: Attack the Boss
attackBtn.addEventListener('click', () => {
    if (hasExtracted) return; // Can't attack if you already left

    // We use a "Transaction" so if 100 people click at the exact same millisecond, 
    // Firebase lines them up and doesn't skip any damage.
    runTransaction(bossHealthRef, (currentHealth) => {
        if (currentHealth > 0) {
            return currentHealth - 1; // Deal 1% damage per click for now
        }
        return currentHealth;
    });

    // Add temporary loot to your backpack (We will make this random later)
    myLootCount += 1; 
    lootCountEl.innerText = myLootCount;
});

// 8. ACTION: Extract (Clock Out)
extractBtn.addEventListener('click', () => {
    if (hasExtracted) return;

    hasExtracted = true;
    attackBtn.disabled = true; // Lock the attack button
    extractBtn.style.background = "#555"; // Grey out the extract button
    extractBtn.innerText = "EXTRACTED";
    
    alert(`You safely clocked out with ${myLootCount} items! They are now in your permanent stash.`);
});

