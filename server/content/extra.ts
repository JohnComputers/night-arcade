// Original offline additions. Lists are curated; no network lookup or generated judging is used.
const words=(value:string)=>value.split('|').map(word=>word.trim().toLowerCase()).filter(Boolean);
export const extraCategories:Record<string,string[]>={
 Animals:words('anteater|antelope|armadillo|axolotl|baboon|badger|barracuda|basset hound|beluga|bison|blackbird|bluebird|blue jay|bobcat|bonobo|budgie|bullfrog|capybara|caribou|cassowary|catfish|centipede|chameleon|chickadee|chinchilla|cicada|clam|clownfish|cockatoo|cod|condor|cormorant|coyote|crane|crayfish|cricket|cuttlefish|dalmatian|dingo|dormouse|dove|dragonfly|dugong|earthworm|echidna|egret|elephant seal|finch|firefly|flounder|fruit bat|gecko|gerbil|gibbon|gnat|goldfish|grasshopper|groundhog|grouse|guinea pig|haddock|halibut|heron|herring|hornet|hummingbird|ibex|jackal|kingfisher|kookaburra|ladybird|ladybug|lark|leech|leopard seal|lizard|lorikeet|macaw|magpie|manatee|mandrill|manta ray|marmot|meerkat|millipede|mongoose|mosquito|mule|mussel|nightingale|ocelot|opossum|orangutan|orca|oryx|osprey|ostrich|oyster|pangolin|parakeet|partridge|pheasant|platypus|poodle|praying mantis|prawn|quokka|red panda|roadrunner|robin|salamander|sardine|scorpion|seahorse|sea lion|sea otter|sea urchin|serval|shrew|silkworm|skunk|slug|snow leopard|sole|starfish|starling|stingray|stork|swallow|swordfish|tapir|tarantula|termite|thrush|tree frog|wallaby|water buffalo|wildebeest|woodpecker|wren'),
 Food:words('acorn squash|adzuki bean|aioli|alfalfa sprouts|amaranth|anchovy|arugula|bagel|baklava|balsamic vinegar|basil|beetroot|blackberry|blackcurrant|blueberry|bok choy|brie|brisket|brownie|buckwheat|bulgur|burrito|butternut squash|cantaloupe|caper|caramel|cardamom|cashew|casserole|cayenne|cheddar|chestnut|chives|chowder|cinnamon|clementine|cocoa|coleslaw|coriander|couscous|cranberry|cream|crepe|croissant|crouton|cumin|custard|daikon|dill|edamame|endive|falafel|fennel|flatbread|flour|focaccia|frittata|fudge|gnocchi|gooseberry|granola|green bean|grits|haddock|hazelnut|hummus|jackfruit|jalapeno|jicama|kefir|kimchi|kohlrabi|kumquat|lasagna|leek|lemongrass|linguine|lychee|macadamia|macaroni|mackerel|mandarin|maple syrup|margarine|marjoram|marshmallow|mashed potato|mayonnaise|millet|mint|molasses|mozzarella|muffin|mulberry|mustard|naan|nutmeg|okra|oregano|orzo|oyster mushroom|pancetta|paprika|parmesan|parsley|parsnip|pastry|pecan|persimmon|pesto|pistachio|polenta|pomegranate|poppy seed|porridge|potato salad|prune|pudding|quesadilla|quiche|ravioli|red cabbage|rhubarb|ricotta|risotto|rosemary|rye|saffron|sage|salsa|scone|seaweed|semolina|sesame|shallot|sherbet|sorbet|sourdough|soybean|spaghetti|stew|sugar|sweet potato|tahini|tamarind|tapioca|tarragon|tempeh|thyme|truffle|turmeric|vermicelli|vinegar|watercress|wheat|yam'),
 Objects:words('abacus|adapter|air purifier|alarm clock|allen key|anvil|armchair|ashtray|awning|badge|barometer|barrel|bathrobe|beaker|bed|bedspread|binoculars|blender|bookcase|bookmark|bottle opener|breadbox|briefcase|brooch|cabinet|calculator|calendar|can opener|candlestick|carabiner|chandelier|chessboard|clipboard|coaster|coat hanger|colander|compass|corkscrew|couch|crayon|cutting board|dartboard|diary|dictionary|dishwasher|doormat|drill|easel|earbuds|egg timer|eraser|extension cord|file cabinet|fire extinguisher|fishing rod|flask|flowerpot|frying pan|funnel|gauze|grater|hairbrush|hairdryer|handbag|headphones|highlighter|hourglass|ice tray|ironing board|jigsaw|kettle|ladle|lantern|lawnmower|lens|level|lounger|magnifying glass|mallet|measuring cup|measuring tape|megaphone|microphone|microscope|mousepad|multimeter|napkin|noticeboard|ottoman|paint roller|palette|paperclip|parasol|pedal|pendulum|pepper mill|photocopier|picture frame|pincushion|pliers|plunger|pocket watch|postcard|projector|protractor|remote control|rolling pin|rubber band|saucepan|saw|scale|screwdriver|sewing machine|sieve|sink|sketchbook|slingshot|smoke detector|spatula|speaker|spectacles|stapler|stepstool|stethoscope|stopwatch|strainer|straw|sundial|sunscreen|tablet|teapot|telescope|thermometer|thermos|thimble|toaster|toolbox|torch|trowel|tweezers|typewriter|vacuum cleaner|vending machine|videocamera|watering can|weather vane|whisk|whiteboard|wrench'),
 Places:words('alley|amphitheater|arcade|arena|art gallery|auditorium|balcony|barbershop|baseball field|basement|bistro|boardwalk|boathouse|botanical garden|boulevard|bowling alley|bus stop|butcher shop|cafeteria|canal|car park|cathedral|chapel|courthouse|courtyard|crosswalk|dance studio|deli|dining room|driveway|embassy|fairground|fire station|fish market|flower shop|football field|foyer|gallery|greenhouse|grocery store|hallway|hardware store|ice rink|inn|intersection|jewelry store|kennel|laundromat|lecture hall|lobby|marina|marketplace|monastery|motels|music hall|observatory|opera house|parking garage|patio|pavilion|pharmacy|pier|planetarium|plaza|police station|porch|pottery studio|promenade|quarry|railway station|reception|recreation center|rooftop|roundabout|sawmill|sculpture garden|shopping mall|sidewalk|skate park|spa|square|stable|subway station|terrace|town hall|tram stop|treehouse|waiting room|windmill|workshop'),
 Countries:words('albania|algeria|andorra|angola|antigua and barbuda|argentina|armenia|australia|austria|azerbaijan|bahamas|bahrain|bangladesh|barbados|belgium|belize|benin|bhutan|bolivia|bosnia and herzegovina|botswana|brazil|brunei|bulgaria|burkina faso|burundi|cambodia|cameroon|canada|cape verde|central african republic|chad|chile|china|colombia|comoros|costa rica|croatia|cuba|cyprus|czechia|denmark|djibouti|dominica|dominican republic|ecuador|egypt|el salvador|equatorial guinea|eritrea|estonia|eswatini|ethiopia|fiji|finland|france|gabon|gambia|georgia|germany|ghana|greece|grenada|guatemala|guinea|guinea bissau|guyana|haiti|honduras|hungary|iceland|india|indonesia|ireland|italy|jamaica|japan|jordan|kazakhstan|kenya|kiribati|kuwait|kyrgyzstan|laos|latvia|lebanon|lesotho|liberia|liechtenstein|lithuania|luxembourg|madagascar|malawi|malaysia|maldives|mali|malta|marshall islands|mauritania|mauritius|mexico|micronesia|moldova|monaco|mongolia|montenegro|morocco|mozambique|namibia|nauru|nepal|netherlands|new zealand|nicaragua|niger|nigeria|north macedonia|norway|oman|pakistan|palau|panama|papua new guinea|paraguay|peru|philippines|poland|portugal|qatar|romania|rwanda|saint kitts and nevis|saint lucia|saint vincent and the grenadines|samoa|san marino|sao tome and principe|saudi arabia|senegal|serbia|seychelles|sierra leone|singapore|slovakia|slovenia|solomon islands|somalia|south africa|south korea|spain|sri lanka|suriname|sweden|switzerland|tajikistan|tanzania|thailand|timor leste|togo|tonga|trinidad and tobago|tunisia|turkey|turkmenistan|tuvalu|uganda|ukraine|united arab emirates|united kingdom|united states|uruguay|uzbekistan|vanuatu|vietnam|zambia|zimbabwe'),
 Jobs:words('accountant|acrobat|actor|actuary|administrator|animator|archaeologist|architect|archivist|artist|astronaut|astronomer|athlete|audiologist|author|baker|banker|barber|barista|beekeeper|biologist|blacksmith|boatbuilder|bookbinder|bookkeeper|botanist|bricklayer|broadcaster|builder|bus driver|butcher|butler|cabinetmaker|cameraperson|carpenter|cartographer|cartoonist|cashier|caterer|chef|chemist|choreographer|cinematographer|cleaner|clerk|coach|comedian|composer|conductor|conservator|copywriter|courier|craftsperson|curator|dancer|decorator|dentist|designer|detective|developer|dietitian|director|diver|doctor|dog groomer|dressmaker|ecologist|economist|editor|electrician|engineer|entomologist|entrepreneur|farmer|filmmaker|firefighter|fisher|florist|forester|game designer|gardener|geographer|geologist|glassblower|goldsmith|graphic designer|groundskeeper|guide|hairdresser|historian|horticulturist|illustrator|inspector|interpreter|inventor|jeweler|journalist|judge|lab technician|landscaper|lawyer|lecturer|librarian|lifeguard|linguist|locksmith|magician|manager|mason|mathematician|mechanic|meteorologist|midwife|model|musician|naturalist|navigator|nurse|nutritionist|oceanographer|optician|painter|paleontologist|paramedic|park ranger|pastry chef|personal trainer|pharmacist|photographer|physicist|physiotherapist|pianist|pilot|plasterer|plumber|poet|potter|presenter|printer|programmer|proofreader|puppeteer|receptionist|researcher|roofer|sailor|sculptor|seamstress|shipwright|shoemaker|sign painter|singer|software engineer|sound engineer|stage manager|stonemason|storyteller|surveyor|tailor|taxi driver|teacher|technician|tour guide|translator|travel agent|tutor|upholsterer|urban planner|veterinarian|violinist|waiter|watchmaker|weaver|welder|woodworker|writer|zookeeper|zoologist'),
 Clothing:words('anorak|apron|balaclava|bangle|baseball cap|bathrobe|beanie|belt|beret|blazer|blouse|boa|bonnet|boots|bow tie|bracelet|breeches|brooch|cardigan|cape|capri pants|clogs|coat|collar|cufflinks|dress|dungarees|earmuffs|earrings|fedora|flip flops|frock|gloves|gown|hairband|headband|helmet|hoodie|jacket|jeans|jersey|jodhpurs|jumpsuit|kimono|leggings|loafers|mittens|moccasins|necklace|necktie|nightgown|overalls|overcoat|pajamas|parka|petticoat|poncho|pullover|raincoat|sandals|sari|sarong|scarf|shawl|shirt|shoes|shorts|skirt|slippers|sneakers|socks|sombrero|stockings|suit|sunhat|suspenders|sweater|sweatshirt|swimsuit|tank top|tights|top hat|tracksuit|trainers|trench coat|trousers|tunic|turban|turtleneck|tuxedo|uniform|veil|vest|waistcoat|wetsuit|windbreaker'),
 Plants:words('acacia|alder|aloe|amaryllis|anemone|angelica|apple tree|ash|aspen|aster|azalea|bamboo|basil|bay|beech|begonia|birch|blackthorn|bluebell|bougainvillea|boxwood|buttercup|cactus|camellia|carnation|cedar|chamomile|cherry tree|chestnut|chive|chrysanthemum|clematis|clover|coconut palm|columbine|cornflower|crocus|cypress|daffodil|dahlia|daisy|dandelion|delphinium|dogwood|elm|eucalyptus|fern|fig tree|fir|forget me not|foxglove|freesia|fuchsia|gardenia|geranium|ginger|gladiolus|gorse|grapevine|hawthorn|hazel|heather|hibiscus|holly|honeysuckle|hosta|hyacinth|hydrangea|iris|ivy|jacaranda|jasmine|juniper|lavender|lemon tree|lilac|lily|linden|lotus|magnolia|maple|marigold|mint|moss|mulberry|narcissus|nasturtium|nettle|oak|oleander|olive tree|orchid|palm|pansy|papyrus|peony|petunia|pine|poinsettia|poppy|primrose|raspberry bush|redwood|reed|rhododendron|rose|rosemary|rowan|sage|sequoia|snapdragon|snowdrop|sorrel|spruce|sunflower|sweet pea|sycamore|thyme|tulip|violet|water lily|willow|wisteria|yarrow|yew|yucca|zinnia'),
 Transport:words('airplane|ambulance|barge|bicycle|biplane|blimp|boat|boxcar|buggy|bulldozer|bus|cable car|camper|canoe|car|caravan|cargo ship|carriage|catamaran|coach|combine harvester|convertible|crane|cruise ship|dinghy|double decker|dump truck|electric car|ferry|fire engine|fishing boat|flatbed|forklift|freight train|gondola|glider|go kart|golf cart|helicopter|hot air balloon|hovercraft|hydrofoil|icebreaker|jet|jet ski|kayak|limousine|locomotive|minibus|minivan|monorail|moped|motorbike|motorcycle|motorhome|ocean liner|paddleboat|pickup truck|raft|rickshaw|roadster|rocket|rowboat|sailboat|schooner|scooter|seaplane|sedan|segway|ship|skateboard|sled|sleigh|snowmobile|speedboat|steamroller|streetcar|submarine|subway|tandem|taxi|tractor|tram|tricycle|trolley|truck|tugboat|unicycle|van|wagon|wheelchair|yacht'),
 'Sports and games':words('archery|badminton|baseball|basketball|billiards|bobsledding|bocce|bowling|boxing|canoeing|chess|checkers|climbing|cricket|croquet|cross country|curling|cycling|darts|diving|dominoes|fencing|field hockey|figure skating|football|frisbee|golf|gymnastics|handball|hiking|hockey|hopscotch|hurdles|ice hockey|ice skating|javelin|judo|jump rope|karate|kayaking|kickball|lacrosse|marathon|netball|orienteering|paddleboarding|paintball|pentathlon|pickleball|ping pong|polo|pool|racquetball|rafting|relay race|roller skating|rounders|rowing|rugby|running|sailing|scuba diving|shuffleboard|skateboarding|skiing|sledding|snooker|snowboarding|soccer|softball|squash|sumo|surfing|swimming|table tennis|tag|taekwondo|tennis|tetherball|trampolining|triathlon|tug of war|volleyball|water polo|weightlifting|windsurfing|wrestling'),
 'Musical instruments':words('accordion|acoustic guitar|bagpipes|banjo|bass drum|bass guitar|bassoon|bell|bongo|bugle|castanets|celesta|cello|clarinet|claves|concertina|conga|cornet|cymbals|didgeridoo|double bass|drum|dulcimer|electric guitar|euphonium|fiddle|flute|french horn|glockenspiel|gong|guitar|harmonica|harp|harpsichord|kazoo|keyboard|lute|lyre|mandolin|maracas|marimba|melodica|oboe|ocarina|organ|panpipes|piano|piccolo|recorder|saxophone|sitar|snare drum|steel drum|synthesizer|tabla|tambourine|theremin|timpani|triangle|trombone|trumpet|tuba|ukulele|vibraphone|viola|violin|woodblock|xylophone|zither')
};

export const extraTrivia:[string,string,string,string,string][]=[
 ['Which word names a six-sided polygon?','Hexagon','Pentagon','Octagon','Triangle'],
 ['What do we call the result of multiplication?','Product','Quotient','Difference','Remainder'],
 ['Which number is the only even prime?','2','4','6','8'],
 ['How is twenty-five percent written as a simple fraction?','One quarter','One half','One third','Three quarters'],
 ['What is the square root of eighty-one?','9','7','8','11'],
 ['Which unit is used to measure electrical resistance?','Ohm','Liter','Meter','Gram'],
 ['Which metric prefix means one thousand?','Kilo','Milli','Centi','Micro'],
 ['What does a prism commonly separate white light into?','A spectrum of colors','Liquid water','Sound waves','Magnetic poles'],
 ['What is the change from liquid to gas called?','Evaporation','Condensation','Freezing','Melting'],
 ['Which process changes a gas into a liquid?','Condensation','Sublimation','Freezing','Melting'],
 ['What kind of animal is a newt?','Amphibian','Mammal','Bird','Insect'],
 ['Which of these animals has feathers?','Owl','Bat','Gecko','Mouse'],
 ['What covers most of a fish’s body?','Scales','Feathers','Fur','Wool'],
 ['Which part of a bird is used primarily for flight?','Wings','Beak','Claws','Tail feathers alone'],
 ['Which plant group includes pine trees?','Conifers','Ferns','Mosses','Grasses'],
 ['What is the process by which a seed begins to grow?','Germination','Erosion','Condensation','Evaporation'],
 ['Which part of a flower can develop into a fruit?','Ovary','Petal','Sepal','Stalk alone'],
 ['What do we call molten rock below Earth’s surface?','Magma','Lava','Granite','Quartz'],
 ['What is an opening that erupts lava called?','Volcano','Glacier','Canyon','Delta'],
 ['What is a large slow-moving mass of ice called?','Glacier','Estuary','Dune','Plateau'],
 ['Which landform is a raised area with a relatively flat top?','Plateau','Valley','Delta','Trench'],
 ['Which imaginary line divides Earth into northern and southern halves?','Equator','Prime meridian','Tropic of Capricorn','Arctic Circle'],
 ['Which ocean lies between Africa and Australia?','Indian Ocean','Arctic Ocean','Southern Ocean only','Atlantic Ocean'],
 ['Which continent is home to the Andes mountain range?','South America','Europe','Africa','Australia'],
 ['What is the longest side of a right triangle called?','Hypotenuse','Radius','Diameter','Diagonal'],
 ['Which word is an antonym of generous?','Stingy','Kind','Giving','Helpful'],
 ['Which word is a synonym for rapid?','Fast','Heavy','Quiet','Distant'],
 ['What is the plural of mouse?','Mice','Mouses only','Mousees','Meese'],
 ['What is a word that describes a noun called?','Adjective','Preposition','Conjunction','Pronoun'],
 ['Which punctuation mark commonly separates items in a list?','Comma','Question mark','Hyphen','Apostrophe'],
 ['Which instrument normally has six strings and frets?','Guitar','Violin','Clarinet','Trumpet'],
 ['Which family does a trumpet belong to?','Brass','Strings','Keyboard','Woodwind'],
 ['What does a conductor commonly use to direct an orchestra?','Baton','Chisel','Compass','Palette'],
 ['What is a repeated rhythmic beat in music called?','Pulse','Hue','Contour','Texture alone'],
 ['What kitchen tool is used to drain cooked pasta?','Colander','Rolling pin','Whisk','Peeler'],
 ['Which tool spreads paint over a large wall surface?','Paint roller','Corkscrew','Sieve','Trowel only'],
 ['Which tool tightens a hexagonal nut?','Wrench','Paintbrush','Whisk','Comb'],
 ['Which device magnifies very small objects?','Microscope','Periscope','Barometer','Compass'],
 ['What does a barometer measure?','Air pressure','Sound pitch','Distance','Electric current'],
 ['What unit measures the frequency of a repeating wave?','Hertz','Newton','Joule','Pascal'],
 ['Which chess piece moves only diagonally?','Bishop','Rook','Knight','King only'],
 ['In chess, which move relocates both the king and a rook?','Castling','Promotion','En passant','Check'],
 ['What do you call a story’s main character?','Protagonist','Footnote','Index','Publisher'],
 ['What is a book of maps called?','Atlas','Dictionary','Thesaurus','Diary'],
 ['What is a list of a book’s chapters commonly called?','Table of contents','Glossary','Bibliography','Appendix']
];
export const extraNumeric:[string,number,string][]=[
 ['How many seconds are in two minutes?',120,'seconds'],['How many hours are in three days?',72,'hours'],
 ['How many millimeters are in one centimeter?',10,'millimeters'],['How many milliliters are in one liter?',1000,'milliliters'],
 ['How many sides does a nonagon have?',9,'sides'],['How many sides does a decagon have?',10,'sides'],
 ['How many vertices does a tetrahedron have?',4,'vertices'],['How many faces does a tetrahedron have?',4,'faces'],
 ['How many edges does a tetrahedron have?',6,'edges'],['How many faces does an octahedron have?',8,'faces'],
 ['How many degrees are in half a full turn?',180,'degrees'],['How many degrees are in three right angles?',270,'degrees'],
 ['How many different sums can two ordinary six-sided dice show?',11,'sums'],['How many outcomes are possible for three coin flips?',8,'outcomes'],
 ['How many cards of each suit are in a standard deck?',13,'cards'],['How many picture cards are in a standard deck?',12,'cards'],
 ['How many squares are in a nine-by-nine grid?',81,'unit squares'],['How many edges does a square-based pyramid have?',8,'edges'],
 ['How many zeros follow the one in one million?',6,'zeros'],['How many seconds are in a quarter of an hour?',900,'seconds'],
 ['How many days are in two ordinary weeks?',14,'days'],['How many quarters make twenty dollars?',80,'quarters'],
 ['How many centimeters are in a ten-meter rope?',1000,'centimeters'],['How many inches are in three feet?',36,'inches'],
 ['How many total spots are on one ordinary six-sided die?',21,'spots'],['How many two-person teams can be formed from four people?',6,'distinct pairs']
];
export const extraEmoji:[string,string][]=[
 ['🐟🥣','fishbowl'],['🏠⛵','houseboat'],['🪨⭐','rock star'],['🌕💡','moonlight'],['⭐💡','starlight'],
 ['❄️⚽','snowball'],['🌧️💧','raindrop'],['🌬️🔔','wind chime'],['🌞⬆️','sunrise'],['🌞⬇️','sunset'],
 ['🦶👣','footprint'],['👂💍','earring'],['🍵🫖','teapot'],['☕🍰','coffee break'],['🛏️📖','bedtime story'],
 ['🌊🛶','river trip'],['🥇🐟','goldfish'],['🥚🥣','egg cup'],['🗝️🔗','keychain'],['🧂🌊','saltwater'],
 ['🌻🌱','sunflower seed'],['🦋🪢','bow tie'],['🪵🔥','wood fire'],['📷📚','photo album'],['🦶🛤️','footpath'],
 ['🧊⛸️','ice skating'],['🏠🔑','house key'],['🧀🍰','cheesecake'],['🍓🥛','strawberry milk'],['🥇🏅','gold medal']
];

export const extraLiar=words('What small task would you happily do every morning?|What unusual item would improve a picnic?|What skill would you teach a friendly robot?|What harmless habit makes you laugh?|What object would you bring to a cloud castle?|What would your imaginary restaurant serve first?|Which sound would make a funny doorbell?|What would you put in a time capsule for next year?|What would you name a pet rock?|What is a surprising place to read a book?|Which household object deserves a tiny award?|What would you invent for people who forget umbrellas?|What would make a waiting room more fun?|What is the best job for a talking squirrel?|What would you draw on a blank flag?|What would a polite dragon collect?|What tiny adventure could fit into an afternoon?|What would you plant in a garden on the moon?|What would you add to a board game about breakfast?|What would be a silly prize for a spelling contest?|What would you ask a very old tree?|What would you pack for a trip inside a storybook?|What kind of hat should a snowman wear?|What would make the best sound for a toy spaceship?|What would you display in a museum of ordinary things?');
export const extraFake:[string,string][]=[
 ['What is the name for a nine-sided polygon?','Nonagon'],['What is the name for a ten-sided polygon?','Decagon'],
 ['What is the name for a number read the same forward and backward?','Palindrome'],
 ['What do we call the longest side of a right triangle?','Hypotenuse'],
 ['What term names the distance around a circle?','Circumference'],
 ['What term describes two lines on a plane that never meet?','Parallel'],
 ['What is a triangle with all sides equal called?','Equilateral'],
 ['What is the result of division called?','Quotient'],
 ['What is the middle value of an ordered data set called?','Median'],
 ['What is the most frequently occurring value in a data set called?','Mode'],
 ['What is the point where two sides of a polygon meet called?','Vertex'],
 ['What is a line through a circle’s center from edge to edge called?','Diameter']
];
export const extraWouldRather:[string,string][]=([
 'Have a tiny greenhouse|Have a tiny observatory','Build a sandcastle|Build a snow fort','Explore a butterfly garden|Explore a planetarium',
 'Read beside a river|Read beside a fireplace','Learn to weave|Learn to carve wood','Grow herbs on a windowsill|Paint a mural in your room',
 'Ride in a hot air balloon|Ride in a sailboat','Design a new board game|Design a new playground','Visit a pottery studio|Visit a glassblowing studio',
 'Cook breakfast for friends|Bake dessert for friends','Find a message in a bottle|Find a map in an old book','Learn to juggle scarves|Learn to balance on a unicycle',
 'Spend a day at a lake|Spend a day in the mountains','Make a short puppet show|Make a short animation','Have a pocket-sized piano|Have a pocket-sized telescope',
 'Win a friendly trivia contest|Win a friendly drawing contest','Collect unusual postcards|Collect unusual buttons','Visit a lighthouse at sunrise|Visit a garden at sunset',
 'Take a train through snowy hills|Take a ferry past green islands','Have a robot water your plants|Have a robot organize your books',
 'Invent a new smoothie|Invent a new sandwich','Play mini golf under stars|Play croquet in a garden','Discover a hidden waterfall|Discover a hidden courtyard',
 'Make a stained-glass window|Make a mosaic path','Teach a class about clouds|Teach a class about seashells'
]).map(row=>row.split('|') as [string,string]);

export const extraTyping=`
The little boat drifted past the island while everyone watched the clouds.
Please put the blue notebook beside the lamp before you leave the room.
We found a narrow path that led from the orchard to a quiet wooden bridge.
At the market, a cheerful baker handed us a paper bag full of warm rolls.
Our team built a tower from cardboard boxes and gave it a tiny green flag.
The cat inspected every empty chair before choosing the softest cushion.
A careful listener can hear the wind change as it passes through the trees.
There is room at this table for another friend and one more interesting story.
The first snow made the familiar street look like a page from a picture book.
I keep a small list of places to explore whenever a free afternoon appears.
The telescope revealed a bright patch of stars just above the distant hill.
We carried our painted kites to the field and waited for the breeze to return.
The garden gate opened with a squeak that sounded almost like a tiny greeting.
A red bicycle leaned against the wall beside three pots of cheerful daisies.
Everyone chose a different color, so the finished banner looked like a rainbow.
The new recipe needed a little patience and one extra spoonful of honey.
Our puzzle began with the corners and ended with a very surprising picture.
The train crossed the bridge slowly enough for us to count the fishing boats.
A friendly dog followed the bouncing ball all the way to the edge of the lawn.
We watched the lanterns glow as the daylight faded behind the old stone tower.
The library had a sunny corner where even a short visit felt like an adventure.
Each player took a turn telling a story about the mysterious silver key.
The path through the woods smelled of pine needles and rain on warm earth.
Someone left a basket of bright apples beside the door with a handwritten note.
The smallest plant in the greenhouse grew a new leaf on the coldest morning.
Our paper airplanes took very different routes across the quiet classroom.
The drummer tapped a gentle rhythm while the rest of the band found their places.
We filled the picnic basket with fruit, sandwiches, and enough cups for everyone.
The old map showed a winding river but no sign of the bridge we had just crossed.
A good question can turn an ordinary conversation into a memorable afternoon.
The museum guide showed us a clock that had been keeping time for many years.
My favorite mug has a crooked handle and a picture of a remarkably serious owl.
The moon rose above the rooftops while the last orange light left the sky.
We took the scenic route home and discovered a shop that sold handmade toys.
The bright yellow umbrella made it easy to find our friends in the busy square.
A row of tiny footprints crossed the snow and disappeared behind the garden shed.
The best part of the game was hearing everyone laugh at the unexpected ending.
Our neighbor taught us how to tie a knot that would hold the little boat safely.
The fountain in the courtyard made a soft sound like rain on a stone path.
We tried three different designs before the cardboard bridge could hold a book.
The smell of cinnamon drifted down the hallway just as the timer began to ring.
A patient artist can find a hundred shades of green in a single summer tree.
The morning bus arrived early, giving us time to choose seats beside the window.
We named the new garden bench after the squirrel that visited it every day.
The kite rose higher when we stopped pulling so hard and trusted the steady wind.
On the last page of the notebook, someone had drawn a very small treasure chest.
The stars seemed brighter after we turned off the porch light and waited quietly.
Our first attempt was far from perfect, but it gave us a clear idea for the next one.
A cheerful tune from the radio kept us company while we sorted the puzzle pieces.
The little cafe served warm soup in blue bowls and always had fresh flowers.
We followed a line of smooth stones from the gate to the far end of the garden.
The paper lantern swayed above the table whenever someone opened the window.
Every corner of the workshop held a tool with a purpose we had yet to discover.
The captain pointed toward the harbor as a flock of gulls crossed the pale sky.
We saved the last piece of cake for the friend who was bringing the board games.
A bright green frog watched us from a leaf beside the quiet pond.
The old camera clicked just as the dog decided to jump into the family picture.
Our walking route passed a bakery, a clock tower, and a surprisingly friendly goose.
The tiny bell above the door rang whenever a new customer entered the bookshop.
We used the empty jars to make lanterns for the evening picnic under the trees.
The rain stopped in time for us to see a perfect rainbow above the football field.
One careful step at a time was enough to cross the stream without wet shoes.
The finished painting looked different from our plan, and that made it even better.
There was a folded note inside the box asking us to share the game with a friend.
The warm light from the window made the snowy garden look peaceful and familiar.
We learned the rules together, then started a round that nobody wanted to end.
The best adventures sometimes begin with a pencil, a blank page, and a curious idea.
`.trim().split('\n');

export const oddDrawingPairs=[
 ['cat','tiger','Animals'],['dog','wolf','Animals'],['horse','zebra','Animals'],['duck','swan','Animals'],['owl','eagle','Animals'],
 ['rabbit','hare','Animals'],['frog','toad','Animals'],['turtle','tortoise','Animals'],['whale','dolphin','Animals'],['butterfly','moth','Animals'],
 ['bee','wasp','Animals'],['lion','cheetah','Animals'],['bear','panda','Animals'],['mouse','hamster','Animals'],['goat','sheep','Animals'],
 ['apple','pear','Food'],['orange','lemon','Food'],['cake','pie','Food'],['cookie','doughnut','Food'],['pizza','pancake','Food'],
 ['carrot','parsnip','Food'],['broccoli','cauliflower','Food'],['grape','cherry','Food'],['sandwich','burger','Food'],['ice cream','cupcake','Food'],
 ['bread','bagel','Food'],['banana','chili pepper','Food'],['watermelon','pumpkin','Food'],['popcorn','cereal','Food'],['soup','porridge','Food'],
 ['cup','bowl','Objects'],['spoon','fork','Objects'],['chair','armchair','Objects'],['lamp','lantern','Objects'],['hat','helmet','Objects'],
 ['shoe','boot','Objects'],['backpack','suitcase','Objects'],['umbrella','parasol','Objects'],['clock','watch','Objects'],['guitar','violin','Objects'],
 ['piano','keyboard','Objects'],['drum','tambourine','Objects'],['brush','comb','Objects'],['broom','mop','Objects'],['key','wrench','Objects'],
 ['beach','desert','Places'],['castle','palace','Places'],['house','cabin','Places'],['mountain','volcano','Places'],['river','canal','Places'],
 ['pond','lake','Places'],['forest','orchard','Places'],['bridge','pier','Places'],['tent','teepee','Places'],['lighthouse','windmill','Places'],
 ['island','peninsula','Places'],['playground','fairground','Places'],['barn','stable','Places'],['garden','park','Places'],['igloo','snow fort','Places'],
 ['car','taxi','Transport'],['bus','tram','Transport'],['train','monorail','Transport'],['bicycle','motorcycle','Transport'],['canoe','kayak','Transport'],
 ['sailboat','rowboat','Transport'],['airplane','glider','Transport'],['helicopter','drone','Transport'],['truck','tractor','Transport'],['rocket','space shuttle','Transport'],
 ['rose','tulip','Plants'],['daisy','sunflower','Plants'],['pine','palm','Plants'],['cactus','aloe','Plants'],['oak leaf','maple leaf','Plants'],
 ['basketball','volleyball','Sports'],['baseball bat','cricket bat','Sports'],['tennis racket','badminton racket','Sports'],['skis','snowboard','Sports'],['roller skates','ice skates','Sports']
].map(([normal,odd,category])=>({normal,odd,category}));

export const majorityPrompts=`
Choose a season.|Spring|Summer|Autumn|Winter
Choose a breakfast.|Pancakes|Toast|Cereal|Oatmeal
Choose a fruit.|Apple|Banana|Orange|Grape
Choose a pet.|Cat|Dog|Rabbit|Fish
Choose a hot drink.|Tea|Coffee|Cocoa|Warm milk
Choose a picnic spot.|Beach|Park|Forest|Lake
Choose a dessert.|Cake|Pie|Ice cream|Cookies
Choose a color for a kite.|Red|Blue|Green|Yellow
Choose a board-game piece.|Hat|Boat|Star|Car
Choose a musical instrument.|Piano|Guitar|Drums|Violin
Choose a quiet hobby.|Reading|Drawing|Knitting|Gardening
Choose a rainy-day activity.|Puzzle|Movie|Baking|Board games
Choose a pizza topping.|Cheese|Mushrooms|Peppers|Olives
Choose a place to explore.|Castle|Museum|Garden|Aquarium
Choose a vehicle for an adventure.|Train|Boat|Bicycle|Camper
Choose a shape for a cookie.|Circle|Star|Heart|Square
Choose a kind of sandwich.|Cheese|Peanut butter|Vegetable|Egg
Choose a flower.|Rose|Daisy|Tulip|Sunflower
Choose a mountain snack.|Apple|Nuts|Sandwich|Granola bar
Choose a snow activity.|Sledding|Snowman|Skiing|Snow angels
Choose a summer activity.|Swimming|Picnic|Cycling|Camping
Choose a cloud shape.|Dragon|Rabbit|Ship|Castle
Choose a picnic drink.|Lemonade|Water|Juice|Iced tea
Choose a friendly mythical creature.|Dragon|Unicorn|Fairy|Phoenix
Choose a garden feature.|Pond|Fountain|Bench|Treehouse
Choose a museum exhibit.|Dinosaurs|Space|Inventions|Art
Choose a toy.|Kite|Blocks|Train set|Puppet
Choose a tiny gift.|Bookmark|Keyring|Badge|Postcard
Choose an ice cream flavor.|Vanilla|Chocolate|Strawberry|Mint
Choose a breakfast fruit.|Banana|Berries|Melon|Orange
Choose a tree.|Oak|Maple|Pine|Willow
Choose a friendly animal mascot.|Otter|Fox|Penguin|Panda
Choose a farm animal.|Cow|Sheep|Horse|Goat
Choose a bird.|Owl|Robin|Parrot|Penguin
Choose a sea creature.|Dolphin|Seahorse|Turtle|Starfish
Choose a garden insect.|Butterfly|Ladybird|Bee|Dragonfly
Choose a star-gazing companion.|Friend|Dog|Cat|Telescope club
Choose a story setting.|Island|Forest|City|Mountaintop
Choose a treasure.|Map|Key|Gem|Old book
Choose a magical power for a pencil.|Draw doors|Change colors|Write music|Erase spills
Choose a playground feature.|Swing|Slide|Climbing frame|Sandbox
Choose a fairground treat.|Popcorn|Candy floss|Pretzel|Toffee apple
Choose a costume hat.|Pirate hat|Wizard hat|Crown|Top hat
Choose a room color.|Blue|Green|Cream|Lavender
Choose a weekend breakfast time.|Early|Midmorning|Noon|Whenever hungry
Choose a soup.|Tomato|Pumpkin|Vegetable|Noodle
Choose a pasta shape.|Spirals|Shells|Tubes|Bows
Choose a salad ingredient.|Tomato|Cucumber|Carrot|Lettuce
Choose a kind of bread.|Sourdough|Whole wheat|Baguette|Flatbread
Choose a jam.|Strawberry|Raspberry|Apricot|Blackberry
Choose a sport to try.|Tennis|Swimming|Badminton|Cycling
Choose a game at a picnic.|Frisbee|Tag|Croquet|Catch
Choose a craft.|Origami|Pottery|Weaving|Painting
Choose a tool for a drawing.|Pencil|Crayon|Marker|Paintbrush
Choose a collection.|Stamps|Shells|Postcards|Buttons
Choose a tune for a doorbell.|Chime|Whistle|Birdsong|Tiny drumroll
Choose a robot helper task.|Dishes|Laundry|Gardening|Tidying
Choose a planet for a poster.|Earth|Mars|Saturn|Neptune
Choose a night-sky feature.|Moon|Stars|Meteor|Milky Way
Choose a time of day.|Dawn|Morning|Afternoon|Evening
Choose a window view.|Sea|Garden|Mountains|City
Choose a walk.|River path|Forest trail|Beach|Neighborhood
Choose a cozy seat.|Armchair|Hammock|Beanbag|Window seat
Choose a light.|Lantern|Desk lamp|Fairy lights|Candle
Choose a pattern.|Stripes|Dots|Checks|Zigzags
Choose a sound.|Rain|Waves|Birdsong|Leaves rustling
Choose a smell from a kitchen.|Bread|Cookies|Soup|Cinnamon
Choose a small adventure.|New trail|New recipe|New game|New craft
Choose a notebook cover.|Stars|Flowers|Mountains|Plain color
Choose a greeting.|Wave|Smile|High five|Hello
Choose a puzzle type.|Jigsaw|Crossword|Maze|Logic puzzle
Choose a way to travel a short distance.|Walk|Bicycle|Bus|Scooter
Choose a lucky symbol.|Star|Clover|Horseshoe|Rainbow
Choose a team name.|Comets|Owls|Otters|Fireflies
Choose a party decoration.|Balloons|Bunting|Lanterns|Paper flowers
Choose a new skill.|Juggling|Drawing|Cooking|Playing music
Choose a story ending.|Happy reunion|New adventure|Mystery solved|Surprising discovery
Choose a place for a secret note.|Book|Bottle|Drawer|Under a flowerpot
Choose a picnic blanket color.|Red|Blue|Green|Yellow
Choose the next game style.|Words|Strategy|Drawing|Arcade
`.trim().split('\n').map(row=>{const [question,...options]=row.split('|');return {question,options};});
export const minorityPrompts=majorityPrompts.map(({question,options})=>({question:question.replace('Choose ','Pick the least popular ').replace('Choose the ','Pick the least popular '),options:[...options]}));
