// =====================
// SHARED CONSTANTS
// =====================
const TILE_COLORS = {
    'trees': '#437144'
    , 'flowers': '#CC3824'
    , 'rocks': '#7D787C'
    , 'farmland': '#3E663F'
    , 'grasslands': '#2FCC72'
    , 'sand pile': '#D9AA87'
    , 'farm': '#6D400A'
    , 'sawmill': '#B91818'
    , 'beach': '#E4AC35'
    , 'crystal': '#B72CB7'
    , 'disco': '#AA4FEB'
    , 'radioactive': '#058F32'
    , 'ice': '#75CCFC'
    , 'citrus tree': '#FFFF3C'
    , 'basalt': '#24292F'
    , 'treehouse': '#90D792'
    , 'glowing mushroom': '#323BD5'
    , 'apple tree': '#e74c3c'
    , 'magma': '#ff4800'
    , 'mesa': '#b97760'
    , 'tree of doom': '#2c3e50'
    , 'prismatic tree': '#8e44ad'
    , 'blossom tree': '#ffc0cb'
    , 'acid rock': '#90be6d'
    , 'castle': '#adb5bd'
    , 'pirate': '#ca6702'
    , 'moai': '#6c757d'
    , 'mutated tree': '#4cc9f0'
    , 'heavenly rock': '#fefae0'
    , 'obsidian': '#2C2034', // Corrected Obsidian color
    'default': '#95a5a6'
};

// ... (The rest of the file remains unchanged)
const MUTATIONS = {
    cosmic: {
        income: 1.75
        , yield: 4
    }
    , swashbuckled: {
        income: 1.50
        , yield: 4
    }
    , moonlit: {
        income: 1.25
        , yield: 3
    }
    , bloodlit: {
        income: 1.50
        , yield: 4
    }
    , gilded: {
        income: 2.25
        , yield: 6
    }
};
const CALCULATOR_RESOURCE_ORDER = ["Wood", "Rocks", "Planks", "Wild Seeds", "Crystal", "Diamond", "Gold", "Sand", "Brick", "Stem", "Uranium", "Lava Rock", "Ice Rock", "Stardust", "Obsidian"];
const MASTER_TILE_DATABASE = {
    "Trees": {
        "cost": 200
        , "color": TILE_COLORS.trees
        , "variants": [{
            "name": "Small Tree"
            , "rarity": "1/1"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Wood": 1
            }
        }, {
            "name": "Large Tree"
            , "rarity": "1/3"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Wood": 2
            }
        }, {
            "name": "Forest Tree"
            , "rarity": "1/8"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Wood": 3
            }
        }, {
            "name": "Small Gold Tree"
            , "rarity": "1/20"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Wood": 10
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Large Gold Tree"
            , "rarity": "1/50"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Wood": 15
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Gold Forest"
            , "rarity": "1/150"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Wood": 20
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Small Diamond Tree"
            , "rarity": "1/250"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Wood": 50
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }, {
            "name": "Large Diamond Tree"
            , "rarity": "1/450"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Wood": 60
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }, {
            "name": "Diamond Forest"
            , "rarity": "1/700"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Wood": 70
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }]
    }
    , "Flowers": {
        "cost": 600
        , "color": TILE_COLORS.flowers
        , "variants": [{
            "name": "Flowers"
            , "rarity": "1/1"
            , "income": 1
            , "isMinable": true
            , "resourceYield": {
                "Wild Seeds": 1
            }
        }, {
            "name": "Colorful Flowers"
            , "rarity": "1/10"
            , "income": 2
            , "isMinable": true
            , "resourceYield": {
                "Wild Seeds": 2
            }
        }, {
            "name": "Big Colorful Flowers"
            , "rarity": "1/100"
            , "income": 5
            , "isMinable": true
            , "resourceYield": {
                "Wild Seeds": 10
            }
        }, {
            "name": "Huge Colorful Flower"
            , "rarity": "1/1000"
            , "income": 10
            , "isMinable": true
            , "resourceYield": {
                "Wild Seeds": 25
            }
        }]
    }
    , "Rocks": {
        "cost": 750
        , "color": TILE_COLORS.rocks
        , "variants": [{
            "name": "Small Normal Rock"
            , "rarity": "1/1"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 2
            }
        }, {
            "name": "Big Normal Rock"
            , "rarity": "1/3"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 2
            }
        }, {
            "name": "Giant Normal Rock"
            , "rarity": "1/40"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 5
            }
        }, {
            "name": "Small Gold Rock"
            , "rarity": "1/20"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 15
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Big Gold Rock"
            , "rarity": "1/50"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 25
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Giant Gold Rock"
            , "rarity": "1/150"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 35
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Small Diamond Rock"
            , "rarity": "1/250"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 35
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }, {
            "name": "Big Diamond Rock"
            , "rarity": "1/450"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 65
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }, {
            "name": "Giant Diamond Rock"
            , "rarity": "1/700"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 150
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }]
    }
    , "Farmland": {
        "cost": 1000
        , "color": TILE_COLORS.farmland
        , "buildCost": {
            "Rocks": 10
            , "Wild Seeds": 10
        }
        , "variants": [{
            "name": "Carrot"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 0.0041
            , "valueRange": [1000, 2500]
        }, {
            "name": "Blueberry"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 0.0083
            , "valueRange": [2500, 3000]
        }, {
            "name": "Cauliflower"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 0.0333
            , "valueRange": [3000, 4500]
        }, {
            "name": "Orange Bell Pepper"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 0.05
            , "valueRange": [4500, 5000]
        }, {
            "name": "Green Bell Pepper"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 0.05
            , "valueRange": [5500, 6250]
        }, {
            "name": "Yellow Bell Pepper"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 0.05
            , "valueRange": [10500, 12000]
        }, {
            "name": "Cantaloupe"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 0.0667
            , "valueRange": [6250, 10500]
        }, {
            "name": "Chili"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 0.25
            , "valueRange": [15000, 25000]
        }, {
            "name": "Corn"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 1
            , "valueRange": [25000, 30000]
        }, {
            "name": "Onion"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 1.5
            , "valueRange": [30000, 50000]
        }, {
            "name": "Red Bell Pepper"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 5
            , "valueRange": [80000, 100000]
        }, {
            "name": "Red Onion"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 5
            , "valueRange": [150000, 160000]
        }, {
            "name": "Watermelon"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 5
            , "valueRange": [200000, 250000]
        }, {
            "name": "Wheat"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 6
            , "valueRange": [200000, 300000]
        }, {
            "name": "Tomato"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 6
            , "valueRange": [500000, 1500000]
        }, {
            "name": "Pumpkin"
            , "rarity": "N/A"
            , "income": 1
            , "growTime": 12
            , "valueRange": [50000000, 100000000]
        }]
    }
    , "Grasslands": {
        "cost": 1500
        , "color": TILE_COLORS.grasslands
        , "variants": [{
            "name": "Grassland"
            , "rarity": "1/1"
            , "income": 1
        }, {
            "name": "Tent"
            , "rarity": "1/5"
            , "income": 3
        }, {
            "name": "Campfire"
            , "rarity": "1/10"
            , "income": 3
        }, {
            "name": "Fountain"
            , "rarity": "1/35"
            , "income": 7
        }, {
            "name": "Radio"
            , "rarity": "1/50"
            , "income": 10
        }, {
            "name": "Cubes"
            , "rarity": "1/150"
            , "income": 10
        }, {
            "name": "Statue"
            , "rarity": "1/250"
            , "income": 30
        }]
    }
    , "Sand Pile": {
        "cost": 5000
        , "color": TILE_COLORS['sand pile']
        , "variants": [{
            "name": "Small Sand Pile"
            , "rarity": "1/1"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Sand": 1
            }
        }, {
            "name": "Large Sand Pile"
            , "rarity": "1/10"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Sand": 3
            }
        }, {
            "name": "Small Gold Sand Pile"
            , "rarity": "1/50"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Sand": 15
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Large Gold Sand Pile"
            , "rarity": "1/150"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Sand": 50
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Small Diamond Sand Pile"
            , "rarity": "1/250"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Sand": 35
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }, {
            "name": "Large Diamond Sand Pile"
            , "rarity": "1/450"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Sand": 65
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }]
    }
    , "Farm": {
        "cost": 7500
        , "color": TILE_COLORS.farm
        , "variants": [{
            "name": "Wagon"
            , "rarity": "1/1"
            , "income": 3
        }, {
            "name": "Cabin"
            , "rarity": "1/3"
            , "income": 5
        }, {
            "name": "Watertower"
            , "rarity": "1/10"
            , "income": 10
        }, {
            "name": "Watchtower"
            , "rarity": "1/25"
            , "income": 20
        }]
    }
    , "Sawmill": {
        "cost": 15000
        , "color": TILE_COLORS.sawmill
        , "variants": [{
            "name": "Sawmill"
            , "rarity": "1/1"
            , "income": 0
            , "isMinable": false
            , "notes": "Processes 10 wood"
        }, {
            "name": "Golden Sawmill"
            , "rarity": "1/25"
            , "income": 0
            , "isMinable": false
            , "notes": "Processes 25 wood"
        }, {
            "name": "Diamond Sawmill"
            , "rarity": "1/100"
            , "income": 0
            , "isMinable": false
            , "notes": "Processes 50 wood"
        }]
    }
    , "Castle": {
        "cost": 25000
        , "source": "Merchant"
        , "color": TILE_COLORS.castle
        , "variants": [{
            "name": "Tower"
            , "rarity": "1/1"
            , "income": 8
        }, {
            "name": "Tower 1"
            , "rarity": "1/5"
            , "income": 0
        }, {
            "name": "Tower 2"
            , "rarity": "1/5"
            , "income": 0
        }, {
            "name": "Castle Wall"
            , "rarity": "1/5"
            , "income": 0
        }, {
            "name": "Castle Wall Corner"
            , "rarity": "1/5"
            , "income": 0
        }, {
            "name": "Castle Gate"
            , "rarity": "1/10"
            , "income": 0
        }, {
            "name": "Castle Wall Tower"
            , "rarity": "1/10"
            , "income": 0
        }]
    }
    , "Crystal": {
        "cost": 50000
        , "color": TILE_COLORS.crystal
        , "variants": [{
            "name": "Small Crystal Rock"
            , "rarity": "1/1"
            , "income": 10
            , "isMinable": true
            , "resourceYield": {
                "Crystal": 2
            }
        }, {
            "name": "Large Crystal Rock"
            , "rarity": "1/5"
            , "income": 15
            , "isMinable": true
            , "resourceYield": {
                "Crystal": 5
            }
        }, {
            "name": "Crystal Tree"
            , "rarity": "1/10"
            , "income": 20
            , "isMinable": true
            , "resourceYield": {
                "Crystal": 2
            }
        }, {
            "name": "Large Crystal Tree"
            , "rarity": "1/30"
            , "income": 25
            , "isMinable": true
            , "resourceYield": {
                "Crystal": 3
            }
        }]
    }
    , "Glowing Mushroom": {
        "cost": 65000
        , "color": TILE_COLORS['glowing mushroom']
        , "variants": [{
            "name": "Small Mushroom"
            , "rarity": "1/1"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Stem": 1
            }
        }, {
            "name": "Medium Mushroom"
            , "rarity": "1/3"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Stem": 1
            }
        }, {
            "name": "Large Mushroom"
            , "rarity": "1/10"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Stem": 1
            }
        }, {
            "name": "Small Gold Mushroom"
            , "rarity": "1/20"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Stem": 15
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Medium Gold Mushroom"
            , "rarity": "1/50"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Stem": 25
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Large Gold Mushroom"
            , "rarity": "1/150"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Stem": 35
            }
            , "specialDrops": {
                "Gold": 0.1
            }
        }, {
            "name": "Small Diamond Mushroom"
            , "rarity": "1/250"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Stem": 40
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }, {
            "name": "Medium Diamond Mushroom"
            , "rarity": "1/450"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Stem": 70
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }, {
            "name": "Large Diamond Mushroom"
            , "rarity": "1/700"
            , "income": 0
            , "isMinable": true
            , "resourceYield": {
                "Stem": 150
            }
            , "specialDrops": {
                "Diamond": 0.1
            }
        }]
    }
    , "Acid Rock": {
        "cost": 65000
        , "color": TILE_COLORS['acid rock']
        , "variants": [{
            "name": "Acid Rock"
            , "rarity": "1/1"
            , "income": 65
        }, {
            "name": "Acid Pool"
            , "rarity": "1/15"
            , "income": 65
        }, {
            "name": "Acid River"
            , "rarity": "1/20"
            , "income": 65
        }, {
            "name": "Acid Rock Pit"
            , "rarity": "1/20"
            , "income": 65
        }, {
            "name": "Acid End"
            , "rarity": "1/20"
            , "income": 65
        }, {
            "name": "Acid Rock Temple"
            , "rarity": "1/20"
            , "income": 65
        }, {
            "name": "Acid Cross"
            , "rarity": "1/20"
            , "income": 0
        }, {
            "name": "Acid Spires"
            , "rarity": "1/20"
            , "income": 65
        }, {
            "name": "Acid Rock Cave"
            , "rarity": "1/20"
            , "income": 65
        }, {
            "name": "Acid Rock Tall Temple"
            , "rarity": "1/25"
            , "income": 65
        }, {
            "name": "Acid Waterfall"
            , "rarity": "1/60"
            , "income": 0
        }]
    }
    , "Apple Tree": {
        "cost": 100000
        , "color": TILE_COLORS['apple tree']
        , "buildCost": {
            "Stem": 5
            , "Wild Seeds": 35
        }
        , "variants": [{
            "name": "Green Apple"
            , "rarity": "40%"
            , "income": 0
            , "growTime": 0.5
            , "valueRange": [40000, 150000]
        }, {
            "name": "Red Apple"
            , "rarity": "40%"
            , "income": 0
            , "growTime": 0.5
            , "valueRange": [100000, 250000]
        }, {
            "name": "Yellow Apple"
            , "rarity": "20%"
            , "income": 0
            , "growTime": 0.5
            , "valueRange": [20000, 50000]
        }]
    }
    , "Beach": {
        "cost": 100000
        , "color": TILE_COLORS.beach
        , "variants": [{
            "name": "Small Sand Castle"
            , "rarity": "1/1"
            , "income": 2
        }, {
            "name": "Ancient Ruins"
            , "rarity": "1/5"
            , "income": 4
        }, {
            "name": "Sand Buckets"
            , "rarity": "1/10"
            , "income": 6
        }, {
            "name": "Medium Sand Castle"
            , "rarity": "1/25"
            , "income": 8
        }, {
            "name": "Large Sand Castle"
            , "rarity": "1/50"
            , "income": 16
        }, {
            "name": "Ancient Cross"
            , "rarity": "1/150"
            , "income": 50
        }, {
            "name": "Ancient Circle"
            , "rarity": "1/150"
            , "income": 50
        }, {
            "name": "Ancient Square"
            , "rarity": "1/150"
            , "income": 50
        }, {
            "name": "Ancient Triangle"
            , "rarity": "1/150"
            , "income": 50
        }, {
            "name": "Ancient Temple"
            , "rarity": "1/350"
            , "income": 175
        }]
    }
    , "Disco": {
        "cost": 250000
        , "color": TILE_COLORS.disco
        , "variants": [{
            "name": "Disco"
            , "rarity": "1/1"
            , "income": 100
        }]
    }
    , "Citrus Tree": {
        "cost": 500000
        , "color": TILE_COLORS['citrus tree']
        , "buildCost": {
            "Stem": 15
            , "Wild Seeds": 45
        }
        , "variants": [{
            "name": "Lime Tree"
            , "rarity": "42.86%"
            , "income": 0
            , "growTime": 2
            , "valueRange": [350000, 600000]
        }, {
            "name": "Orange Tree"
            , "rarity": "42.86%"
            , "income": 0
            , "growTime": 2
            , "valueRange": [100000, 500000]
        }, {
            "name": "Lemon Tree"
            , "rarity": "14.29%"
            , "income": 0
            , "growTime": 2
            , "valueRange": [100000, 750000]
        }]
    }
    , "Basalt": {
        "cost": 500000
        , "color": TILE_COLORS.basalt
        , "variants": [{
            "name": "Basalt Magma"
            , "rarity": "1/1"
            , "income": 30
        }, {
            "name": "Geysers"
            , "rarity": "1/5"
            , "income": 50
        }, {
            "name": "Small Volcano"
            , "rarity": "1/10"
            , "income": 60
        }, {
            "name": "Dragon Skeleton Head"
            , "rarity": "1/150"
            , "income": 100
            , "isDragonPart": true
        }, {
            "name": "Dragon Skeleton Arms"
            , "rarity": "1/150"
            , "income": 100
            , "isDragonPart": true
        }, {
            "name": "Dragon Skeleton Legs"
            , "rarity": "1/150"
            , "income": 100
            , "isDragonPart": true
        }]
    }
    , "Terracotta": {
        "cost": 500000
        , "source": "Merchant"
        , "color": TILE_COLORS.mesa
        , "variants": [{
            "name": "Flower Pots"
            , "rarity": "1/1"
            , "income": 2
            , "isMinable": true
            , "resourceYield": {
                "Brick": 1
                , "Wild Seeds": 1
            }
        }, {
            "name": "Terracotta Flowers"
            , "rarity": "1/5"
            , "income": 4
            , "isMinable": true
            , "resourceYield": {
                "Wild Seeds": 2
            }
        }, {
            "name": "Terracotta Side Wall"
            , "rarity": "1/5"
            , "income": 4
        }, {
            "name": "Terracotta Archway"
            , "rarity": "1/5"
            , "income": 5
        }, {
            "name": "Terracotta Wall"
            , "rarity": "1/5"
            , "income": 5
        }, {
            "name": "Terracotta Side Tiles"
            , "rarity": "1/10"
            , "income": 5
        }, {
            "name": "Terracotta Tiles"
            , "rarity": "1/25"
            , "income": 20
        }, {
            "name": "Terracotta Fountain"
            , "rarity": "1/50"
            , "income": 25
        }]
    }
    , "Tropical Tree": {
        "cost": 750000
        , "source": "Merchant"
        , "color": '#27ae60'
        , "buildCost": {
            "Stem": 35
            , "Wild Seeds": 65
        }
        , "variants": [{
            "name": "Avocado Tree"
            , "rarity": "42.86%"
            , "income": 0
            , "growTime": 1
            , "valueRange": [300000, 950000]
        }, {
            "name": "Mango Tree"
            , "rarity": "35.71%"
            , "income": 0
            , "growTime": 1
            , "valueRange": [200000, 1200000]
        }, {
            "name": "Banana Tree"
            , "rarity": "21.43%"
            , "income": 0
            , "growTime": 1
            , "valueRange": [200000, 900000]
        }]
    }
    , "Moai": {
        "cost": 1000000
        , "color": TILE_COLORS.moai
        , "variants": [{
            "name": "Moai"
            , "rarity": "1/1"
            , "income": 50
            , "notes": "+1.1x crop luck"
        }, {
            "name": "Big Moai"
            , "rarity": "1/1000"
            , "income": 150
            , "notes": "+1.5x crop luck"
        }]
    }
    , "Ice": {
        "cost": 1500000
        , "color": TILE_COLORS.ice
        , "variants": [{
            "name": "Ice"
            , "rarity": "1/1"
            , "income": 75
            , "isMinable": true
            , "resourceYield": {
                "Ice Rock": 1
            }
        }, {
            "name": "Ice Broken"
            , "rarity": "1/10"
            , "income": 100
            , "isMinable": true
            , "resourceYield": {
                "Ice Rock": 3
            }
        }, {
            "name": "Ice Final"
            , "rarity": "1/25"
            , "income": 125
            , "isMinable": true
            , "resourceYield": {
                "Ice Rock": 5
            }
        }]
    }
    , "Magma": {
        "cost": 2000000
        , "color": TILE_COLORS.magma
        , "variants": [{
            "name": "Magma"
            , "rarity": "1/1"
            , "income": 100
            , "isMinable": true
            , "resourceYield": {
                "Lava Rock": 1
            }
        }, {
            "name": "Magma Two"
            , "rarity": "1/10"
            , "income": 125
            , "isMinable": true
            , "resourceYield": {
                "Lava Rock": 3
            }
        }, {
            "name": "Magma Three"
            , "rarity": "1/25"
            , "income": 150
            , "isMinable": true
            , "resourceYield": {
                "Lava Rock": 5
            }
        }]
    }
    , "Blossom Tree": {
        "cost": 2500000
        , "source": "Merchant"
        , "color": TILE_COLORS['blossom tree']
        , "variants": [{
            "name": "Tiny Blossom"
            , "rarity": "46.58%"
            , "income": 0
            , "growTime": 8
            , "valueRange": [800000, 1000000]
        }, {
            "name": "Small Blossom"
            , "rarity": "31.06%"
            , "income": 0
            , "growTime": 8
            , "valueRange": [800000, 2000000]
        }, {
            "name": "Large Blossom"
            , "rarity": "18.63%"
            , "income": 0
            , "growTime": 8
            , "valueRange": [800000, 6000000]
        }, {
            "name": "Rainbow Blossom"
            , "rarity": "3.73%"
            , "income": 0
            , "growTime": 8
            , "valueRange": [800000, 20000000]
        }]
    }
    , "Radioactive": {
        "cost": 5000000
        , "color": TILE_COLORS.radioactive
        , "variants": [{
            "name": "Radioactive"
            , "rarity": "1/1"
            , "income": 200
            , "isMinable": true
            , "resourceYield": {
                "Uranium": 3.5
            }
        }]
    }
    , "Mesa": {
        "cost": 0
        , "source": "Small Box"
        , "color": TILE_COLORS.mesa
        , "variants": [{
            "name": "Small Mesa"
            , "rarity": "1/1"
            , "income": 1
            , "isMinable": true
            , "resourceYield": {
                "Brick": 1
            }
        }, {
            "name": "Medium Mesa"
            , "rarity": "1/5"
            , "income": 2
            , "isMinable": true
            , "resourceYield": {
                "Brick": 2
            }
        }]
    }
    , "Tree of Doom": {
        "cost": 0
        , "source": "Mystery Box"
        , "color": TILE_COLORS['tree of doom']
        , "variants": [{
            "name": "Tree of Doom"
            , "rarity": "0.1-0.5%"
            , "income": 250
            , "isMinable": true
            , "hitValue": 1000
            , "maxHits": 5
            , "specialDrops": {
                "Gold": 0.1
                , "Diamond": 0.1
            }
        }]
    }
    , "Prismatic Tree": {
        "cost": 0
        , "source": "Trevor's Quest"
        , "color": TILE_COLORS['prismatic tree']
        , "variants": [{
            "name": "Prismatic Tree"
            , "rarity": "N/A"
            , "income": 50
            , "isMinable": true
            , "hitValue": 250
            , "maxHits": 10
        }]
    }
    , "Heavenly Rock": {
        "cost": 0
        , "source": "Large Box"
        , "color": TILE_COLORS['heavenly rock']
        , "variants": [{
            "name": "Heavenly Rock"
            , "rarity": "0.1%"
            , "income": 316
            , "isMinable": true
            , "resourceYield": {
                "Rocks": 1000
            }
            , "maxHits": 3
        }]
    }
    , "Mutated Tree": {
        "cost": 0
        , "source": "Crafting"
        , "color": TILE_COLORS['mutated tree']
        , "variants": [{
            "name": "Mutant Apple"
            , "rarity": "57.14%"
            , "income": 0
            , "growTime": 16
            , "valueRange": [8000000, 15000000]
        }, {
            "name": "Mutant Grape"
            , "rarity": "34.29%"
            , "income": 0
            , "growTime": 16
            , "valueRange": [8000000, 20000000]
        }, {
            "name": "Mutant Lime"
            , "rarity": "8.57%"
            , "income": 0
            , "growTime": 16
            , "valueRange": [8000000, 25000000]
        }]
    }
    , "Pirate": {
        "cost": 0
        , "source": "Pirate Event"
        , "color": TILE_COLORS.pirate
        , "variants": [{
            "name": "Pirate Palm Trees"
            , "rarity": "1/1"
            , "income": 0
        }, {
            "name": "Stranded Boat"
            , "rarity": "1/5"
            , "income": 0
        }, {
            "name": "Pirate House"
            , "rarity": "1/20"
            , "income": 0
        }, {
            "name": "Captains House"
            , "rarity": "1/35"
            , "income": 0
        }, {
            "name": "Cannon House"
            , "rarity": "1/50"
            , "income": 0
        }]
    }
    , "Cosmetic Tile Bridge": {
        "cost": 0
        , "source": "Crafting"
        , "color": TILE_COLORS.default
        , "variants": [{
            "name": "Cosmetic Tile Bridge"
            , "rarity": "N/A"
            , "income": 5
        }]
    }
    , "Radioactive Flower": {
        "cost": 0
        , "source": "Crafting"
        , "color": TILE_COLORS.radioactive
        , "variants": [{
            "name": "Radioactive Flower"
            , "rarity": "N/A"
            , "income": 500
        }]
    }
    , "Disco Booth": {
        "cost": 0
        , "source": "Special"
        , "color": TILE_COLORS.disco
        , "variants": [{
            "name": "Disco Booth"
            , "rarity": "N/A"
            , "income": 0
            , "notes": "+3% total passive income per adjacent Disco tile"
        }]
    }
    , "Group Tile": {
        "cost": 0
        , "source": "Special"
        , "color": "#f1c40f"
        , "variants": [{
            "name": "Group Tile"
            , "rarity": "N/A"
            , "income": 0
            , "notes": "Provides a global +15% boost"
        }]
    }
    , "Treehouse": {
        "cost": 0
        , "source": "Special"
        , "color": TILE_COLORS.treehouse
        , "variants": [{
            "name": "Treehouse"
            , "rarity": "N/A"
            , "income": 100
        }]
    }
};
const RESOURCE_PRICES = {
    "Wild Seeds": {
        price: 10
        , img: "Seed.png"
    }
    , "Wood": {
        price: 20
        , img: "Wood.png"
    }
    , "Rocks": {
        price: 30
        , img: "Rock.png"
    }
    , "Sand": {
        price: 30
        , img: "Sand.png"
    }
    , "Brick": {
        price: 40
        , img: "Brick.png"
    }
    , "Planks": {
        price: 60
        , img: "Plank.png"
    }
    , "Stem": {
        price: 135
        , img: "Stem.png"
    }
    , "Crystal": {
        price: 150
        , img: "Crystal.png"
    }
    , "Gold": {
        price: 350
        , img: "Gold.png"
    }
    , "Diamond": {
        price: 500
        , img: "Diamond.png"
    }
    , "Ice Rock": {
        price: 700
        , img: "Ice_Rock.png"
    }
    , "Lava Rock": {
        price: 1000
        , img: "Lava_Rock.png"
    }
    , "Stardust": {
        price: 3000
        , img: "Stardust.png"
    }
    , "Obsidian": {
        price: 5000
        , img: "Obsidian.png"
    }
    , "Uranium": {
        price: 33000
        , img: "Atom.png"
    }
};
const OFFLINE_MULTIPLIERS = [1, 1.15, 1.30, 1.45, 1.60, 1.75, 1.90, 2.05, 2.20, 2.35, 2.50, 2.65, 2.80, 2.95, 3.10, 3.25, 3.40, 3.55, 3.70, 3.85, 4.00, 4.15, 4.30, 4.45, 4.60, 4.75];
const REGROWTH_SPEEDS = [1, 1.17, 1.34, 1.51, 1.68, 1.85, 2.02, 2.19, 2.36, 2.53, 2.7, 2.87, 3.04, 3.21, 3.38, 3.55, 3.72, 3.89, 4.06, 4.23, 4.4, 4.57, 4.74, 4.91, 5.08, 5.25, 5.42, 5.59, 5.76, 5.93, 6.1, 6.27, 6.44, 6.61, 6.78, 6.95, 7.12, 7.29, 7.46, 7.63, 7.8, 7.97, 8.14, 8.31, 8.48, 8.65, 8.82, 8.99, 9.16, 9.33, 9.5];

function parseNumberInput(str) {
    if (!str || typeof str !== 'string') return 0;
    let value = str.toLowerCase()
        .replace(/,/g, '');
    const tMatch = value.match(/(\d+\.?\d*)t/);
    if (tMatch) return parseFloat(tMatch[1]) * 1e12;
    const bMatch = value.match(/(\d+\.?\d*)b/);
    if (bMatch) return parseFloat(bMatch[1]) * 1e9;
    const mMatch = value.match(/(\d+\.?\d*)m/);
    if (mMatch) return parseFloat(mMatch[1]) * 1e6;
    const kMatch = value.match(/(\d+\.?\d*)k/);
    if (kMatch) return parseFloat(kMatch[1]) * 1e3;
    return parseFloat(value) || 0;
}

function formatNumberShort(num) {
    if (num >= 1e12) return (num / 1e12)
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/\.0$/, '') + 'T';
    if (num >= 1e9) return (num / 1e9)
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/\.0$/, '') + 'B';
    if (num >= 1e6) return (num / 1e6)
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3)
        .toFixed(2)
        .replace(/\.00$/, '')
        .replace(/\.0$/, '') + 'K';
    return num.toString();
}

function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position: 'fixed'
        , bottom: '20px'
        , left: '50%'
        , transform: 'translateX(-50%)'
        , background: 'var(--accent-green)'
        , color: 'var(--bg-dark)'
        , padding: '10px 20px'
        , borderRadius: '8px'
        , zIndex: '9999'
        , fontWeight: 'bold'
        , transition: 'opacity 0.5s'
    });
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 500);
    }, 2500);
}

function destroyCustomSelects() {
    document.querySelectorAll('.custom-select-wrapper')
        .forEach(wrapper => {
            const selectedDiv = wrapper.querySelector('.select-selected');
            const itemsDiv = wrapper.querySelector('.select-items');
            if (selectedDiv) selectedDiv.remove();
            if (itemsDiv) itemsDiv.remove();
        });
}

function initializeCustomSelects() {
    destroyCustomSelects();
    document.querySelectorAll('.custom-select-wrapper')
        .forEach(wrapper => {
            const select = wrapper.querySelector('select');
            if (!select) return;
            const selectedDiv = document.createElement('div');
            selectedDiv.className = 'select-selected';
            selectedDiv.innerHTML = select.options[select.selectedIndex]?.innerHTML || '&nbsp;';
            wrapper.appendChild(selectedDiv);
            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'select-items select-hide';
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].style.display === 'none') continue;
                const optionDiv = document.createElement('div');
                optionDiv.className = 'select-option';
                optionDiv.innerHTML = select.options[i].innerHTML;
                if (i === select.selectedIndex) optionDiv.classList.add('same-as-selected');
                optionDiv.addEventListener('click', function () {
                    for (let j = 0; j < select.options.length; j++) {
                        if (select.options[j].innerHTML == this.innerHTML) {
                            select.selectedIndex = j;
                            selectedDiv.innerHTML = this.innerHTML;
                            wrapper.querySelectorAll('.same-as-selected')
                                .forEach(s => s.classList.remove('same-as-selected'));
                            this.classList.add('same-as-selected');
                            break;
                        }
                    }
                    selectedDiv.click();
                    select.dispatchEvent(new Event('change'));
                });
                itemsDiv.appendChild(optionDiv);
            }
            wrapper.appendChild(itemsDiv);
            selectedDiv.addEventListener('click', function (e) {
                e.stopPropagation();
                closeAllSelect(this);
                this.nextSibling.classList.toggle('select-hide');
                this.classList.toggle('select-arrow-active');
            });
        });
}

function closeAllSelect(elmnt) {
    document.querySelectorAll('.select-items')
        .forEach(item => {
            if (elmnt !== item.previousSibling) item.classList.add('select-hide');
        });
    document.querySelectorAll('.select-selected')
        .forEach(sel => {
            if (elmnt !== sel) sel.classList.remove('select-arrow-active');
        });
}

function updateCustomSelectDisplay(selectElement) {
    const wrapper = selectElement.closest('.custom-select-wrapper');
    if (!wrapper) return;
    const selectedDiv = wrapper.querySelector('.select-selected');
    if (selectedDiv) {
        selectedDiv.innerHTML = selectElement.options[selectElement.selectedIndex]?.innerHTML || '&nbsp;';
    }
}

function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

function shadeColor(hex, percent) {
    try {
        const num = parseInt(hex.replace('#', ''), 16);
        let r = (num >> 16) + percent
            , g = ((num >> 8) & 0x00FF) + percent
            , b = (num & 0x0000FF) + percent;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return '#' + (b | (g << 8) | (r << 16))
            .toString(16)
            .padStart(6, '0');
    } catch {
        return hex;
    }
}
document.addEventListener('click', closeAllSelect);
