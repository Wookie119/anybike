(function(){
"use strict";
const MARKET_DATA={"UG":{"country":"Uganda","cities":["Kampala","Mbale","Jinja","Arua","Gulu","Mbarara","Bombo","Masaka"],"regions":["Kampala","Bungokho","Jinja","Arua Municipality","Aswa","Kashari"],"ports":[],"landlocked":true},"IT":{"country":"Italy","cities":["Rome","Milan","Naples","Turin","Florence","Palermo","Catania","Genoa"],"regions":["Lazio","Lombardia","Campania","Piemonte","Toscana","Sicily"],"ports":["Leghorn","Genoa","Trieste"]},"AX":{"country":"Aland","cities":["Mariehamn"],"regions":["Finström"],"ports":[]},"PS":{"country":"Palestine","cities":["Gaza City","Ramallah"],"regions":[],"ports":[]},"VA":{"country":"Vatican","cities":["Vatican City"],"regions":["Lazio"],"ports":[],"landlocked":true},"FR":{"country":"France","cities":["Paris","Lyon","Marseille","Lille","Toulouse","Bordeaux","Rouen","Strasbourg"],"regions":["Île-de-France","Rhône-Alpes","Provence-Alpes-Côte-d'Azur","Nord-Pas-de-Calais","Midi-Pyrénées","Aquitaine"],"ports":["Fos sur Mer","Dunkerque","Rouen"]},"AQ":{"country":"Antarctica","cities":["McMurdo Station","Esperanza Base","Casey Station","Amundsen–Scott South Pole Station","Mirny Station","Marambio Base","Base Presidente Montalva","Rothera Station"],"regions":[],"ports":[]},"ZM":{"country":"Zambia","cities":["Lusaka","Kitwe","Kabwe","Livingstone","Mufulira","Chipata"],"regions":["Lusaka","Copperbelt","Central","Southern","Eastern"],"ports":[],"landlocked":true},"NA":{"country":"Namibia","cities":["Windhoek","Walvis Bay","Swakopmund","Otjiwarongo","Grootfontein","Keetmanshoop","Lüderitz"],"regions":["Khomas","Erongo","Otjozondjupa","Karas"],"ports":["Walvis Bay"]},"MQ":{"country":"France","cities":["Fort-de-France"],"regions":["Martinique"],"ports":["Fort de France"]},"JP":{"country":"Japan","cities":["Tokyo","Ōsaka","Nagoya","Fukuoka","Sapporo","Sendai","Hiroshima","Kyoto"],"regions":["Tokyo","Osaka","Aichi","Fukuoka","Hokkaido","Miyagi"],"ports":["Tokyo","Yokohama","Shimizu"]},"GF":{"country":"France","cities":["Cayenne","Saint-Laurent-du-Maroni"],"regions":["Guinaa"],"ports":[]},"GP":{"country":"France","cities":["Basse-terre"],"regions":["Guadeloupe"],"ports":["Pointe a Pitre"]},"RS":{"country":"Serbia","cities":["Belgrade","Novi Sad"],"regions":["Grad Beograd","Južno-Backi"],"ports":[],"landlocked":true},"BA":{"country":"Bosnia and Herzegovina","cities":["Sarajevo","Banja Luka"],"regions":["Sarajevo","Serbian Republic"],"ports":[]},"KY":{"country":"Cayman Islands","cities":["George Town"],"regions":[],"ports":[]},"TC":{"country":"Turks and Caicos Islands","cities":["Grand Turk"],"regions":[],"ports":[]},"IM":{"country":"Isle of Man","cities":["Douglas"],"regions":[],"ports":[]},"SM":{"country":"San Marino","cities":["San Marino"],"regions":[],"ports":[],"landlocked":true},"CW":{"country":"Curacao","cities":["Willemstad"],"regions":[],"ports":[]},"AW":{"country":"Aruba","cities":["Oranjestad"],"regions":[],"ports":["Oranjestad"]},"LI":{"country":"Liechtenstein","cities":["Vaduz"],"regions":[],"ports":[],"landlocked":true},"GI":{"country":"Gibraltar","cities":["Gibraltar"],"regions":["Gibraltar"],"ports":[]},"SZ":{"country":"eSwatini","cities":["Mbabane","Lobamba"],"regions":["Hhohho","Manzini"],"ports":[],"landlocked":true},"GB":{"country":"United Kingdom","cities":["London","Birmingham","Manchester","Glasgow","Cardiff","Edinburgh","Belfast"],"regions":["Westminster","West Midlands","Manchester","Glasgow","Cardiff","Edinburgh"],"ports":["Tilbury","Thames Haven","Southampton"]},"SJ":{"country":"Svalbard and Jan Mayen Islands","cities":["Longyearbyen"],"regions":["Svalbard"],"ports":[]},"LU":{"country":"Luxembourg","cities":["Luxembourg"],"regions":["Luxembourg"],"ports":[],"landlocked":true},"NC":{"country":"New Caledonia","cities":["Nouméa"],"regions":["Sud"],"ports":["Noumea"]},"GE":{"country":"Georgia","cities":["Tbilisi","Batumi","Sukhumi"],"regions":["Tbilisi","Ajaria","Abkhazia"],"ports":["Poti"]},"PT":{"country":"Portugal","cities":["Lisbon","Funchal","Ponta Delgada"],"regions":["Lisboa","Madeira","Azores"],"ports":["Lisbon","Leixoes","Aveiro"]},"SD":{"country":"Sudan","cities":["Khartoum","Omdurman","Port Sudan","Kassala","Al-Ubayyid","Nyala","El Fasher","Geneina"],"regions":["Khartoum","Red Sea","Kassala","North Kurdufan","South Darfur","Northern Darfur"],"ports":[]},"FM":{"country":"Federated States of Micronesia","cities":["Palikir"],"regions":[],"ports":[]},"MH":{"country":"Marshall Islands","cities":["Majuro"],"regions":[],"ports":[]},"GU":{"country":"Guam","cities":["Agana"],"regions":[],"ports":["Guam"]},"TV":{"country":"Tuvalu","cities":["Funafuti"],"regions":[],"ports":["Funafuti"]},"PW":{"country":"Palau","cities":["Melekeok"],"regions":[],"ports":[]},"EH":{"country":"Western Sahara","cities":["Bir Lehlou"],"regions":[],"ports":[]},"MC":{"country":"Monaco","cities":["Monaco"],"regions":[],"ports":[]},"KI":{"country":"Kiribati","cities":["Tarawa"],"regions":[],"ports":[]},"KM":{"country":"Comoros","cities":["Moroni"],"regions":[],"ports":[]},"MO":{"country":"Macau S.A.R","cities":["Macau"],"regions":[],"ports":[]},"AD":{"country":"Andorra","cities":["Andorra"],"regions":[],"ports":[],"landlocked":true},"US":{"country":"United States of America","cities":["New York","Los Angeles","Chicago","Miami","Philadelphia","Dallas","Atlanta","Boston"],"regions":["New York","California","Illinois","Florida","Pennsylvania","Texas"],"ports":["Newark","Los Angeles","Long Beach"]},"PK":{"country":"Pakistan","cities":["Karachi","Lahore","Multan","Gujranwala","Hyderabad","Peshawar","Islamabad","Quetta"],"regions":["Sind","Punjab","N.W.F.P.","F.C.T.","Baluchistan"],"ports":["Karachi","Port Qasim"]},"KR":{"country":"South Korea","cities":["Seoul","Busan","Incheon","Daejeon","Gwangju"],"regions":["Seoul","Busan","Inch'on-gwangyoksi","Daejeon","Kwangju-gwangyoksi"],"ports":["Busan","Inchon","Kwangyang"]},"NG":{"country":"Nigeria","cities":["Lagos","Kano","Ibadan","Abuja","Kaduna","Benin City","Port Harcourt","Ogbomosho"],"regions":["Lagos","Kano","Oyo","Federal Capital Territory","Kaduna","Edo"],"ports":["Tin Can Island Port","Apapa","Onne Seaport"]},"CN":{"country":"China","cities":["Shanghai","Beijing","Guangzhou","Shenzhen","Wuhan","Tianjin","Chongqing","Shenyeng"],"regions":["Shanghai","Beijing","Guangdong","Hubei","Tianjin","Chongqing"],"ports":["Shanghai","Shenzhen","Chiwan"]},"IN":{"country":"India","cities":["Mumbai","Delhi","Kolkata","Chennai","Bengaluru","Hyderabad","Amaravati","Ahmedabad"],"regions":["Maharashtra","Delhi","West Bengal","Tamil Nadu","Karnataka","Telangana"],"ports":["Kolkata","Jawaharlal Nehru","Haldia Port. India"]},"UY":{"country":"Uruguay","cities":["Montevideo","Durazno"],"regions":["Montevideo","Durazno"],"ports":["Montevideo"]},"VE":{"country":"Venezuela","cities":["Caracas","Maracaibo","Valencia","Ciudad Guayana","San Cristóbal","Mérida","Puerto Ayacucho"],"regions":["Distrito Capital","Zulia","Carabobo","Bolívar","Táchira","Mérida"],"ports":["La Guaira","Puerto Cabello","Carupano"]},"TT":{"country":"Trinidad and Tobago","cities":["Port-of-Spain"],"regions":["Port of Spain"],"ports":["Point Lisas"]},"TG":{"country":"Togo","cities":["Lomé","Atakpamé"],"regions":["Maritime","Plateaux"],"ports":["Lome"]},"TN":{"country":"Tunisia","cities":["Tunis","Sousse"],"regions":["Tunis","Sousse"],"ports":["Tunis","Sfax"]},"YE":{"country":"Yemen","cities":["Sanaa","Aden","Taizz"],"regions":["Amanat Al Asimah","`Adan","Ta`izz"],"ports":["Aden","Hodeidah"]},"UA":{"country":"Ukraine","cities":["Kyiv","Kharkiv","Dnipro","Odessa","Donetsk","Lviv","Zhytomyr"],"regions":["Kiev","Kharkiv","Dnipropetrovs'k","Odessa","Donets'k","L'viv"],"ports":["Odessa","Ilyichevsk"]},"TM":{"country":"Turkmenistan","cities":["Ashgabat","Türkmenabat","Mary","Türkmenbaşy"],"regions":["Ahal","Chardzhou","Mary","Balkan"],"ports":[],"landlocked":true},"UZ":{"country":"Uzbekistan","cities":["Tashkent","Samarkand","Andijan","Bukhara","Nukus"],"regions":["Tashkent","Samarkand","Andijon","Bukhoro","Karakalpakstan"],"ports":[],"landlocked":true},"VN":{"country":"Vietnam","cities":["Ho Chi Minh City","Hanoi","Haiphong","Da Nang"],"regions":["H? Chí Minh city","Thái Nguyên","Qu?ng Ninh","Ðà N?ng"],"ports":["Saigon","Haiphong","Da Nang"]},"ZW":{"country":"Zimbabwe","cities":["Harare","Bulawayo","Chitungwiza"],"regions":["Harare","Bulawayo"],"ports":[],"landlocked":true},"CM":{"country":"Cameroon","cities":["Douala","Yaoundé","Bamenda","Garoua","Maroua","Ebolowa"],"regions":["Littoral","Centre","Nord-Ouest","Nord","Extrême-Nord","Sud"],"ports":["Douala"]},"TR":{"country":"Turkey","cities":["Istanbul","Ankara","İzmir","Bursa","Adana","Konya","Samsun"],"regions":["Istanbul","Ankara","Izmir","Bursa","Adana","Konya"],"ports":["Haydarpasa Port. Istanbul","Bosperus","Ambarli"]},"RW":{"country":"Rwanda","cities":["Kigali"],"regions":["Kigali City"],"ports":[],"landlocked":true},"SR":{"country":"Suriname","cities":["Paramaribo","Cottica"],"regions":["Paramaribo","Sipaliwini"],"ports":["Paramaribo"]},"ES":{"country":"Spain","cities":["Madrid","Barcelona","Seville","Bilbao","Valencia","Vigo","Las Palmas","Córdoba"],"regions":["Comunidad de Madrid","Cataluña","Andalucía","País Vasco","Comunidad Valenciana","Galicia"],"ports":["Barcelona","Tarragona","Valencia"]},"NE":{"country":"Niger","cities":["Niamey","Zinder","Agadez","Tahoua"],"regions":["Niamey","Maradi","Zinder","Agadez","Tahoua"],"ports":[],"landlocked":true},"RO":{"country":"Romania","cities":["Bucharest","Iași","Constanța"],"regions":["Bucharest","Iasi","Constanta"],"ports":["Constanta"]},"SE":{"country":"Sweden","cities":["Stockholm","Malmö","Sundsvall","Luleå"],"regions":["Stockholm","Skåne","Västernorrland","Norrbotten"],"ports":["Gothenburg","Karlskrona","Slite"]},"TH":{"country":"Thailand","cities":["Bangkok","Chiang Mai","Nakhon Ratchasima","Surat Thani"],"regions":["Bangkok Metropolis","Chiang Mai","Nakhon Ratchasima","Surat Thani"],"ports":["Laem Chabang","Songkhla"]},"PE":{"country":"Peru","cities":["Lima","Arequipa","Trujillo","Iquitos","Huancayo","Piura","Cusco","Chimbote"],"regions":["Lima","Arequipa","La Libertad","Loreto","Junín","Piura"],"ports":["Callao","Paita","Ilo"]},"PY":{"country":"Paraguay","cities":["Asunción","Ciudad del Este"],"regions":["Asunción","Alto Paran"],"ports":[],"landlocked":true},"SN":{"country":"Senegal","cities":["Dakar","Kaolack","Kaédi"],"regions":["Dakar","Kaolack","Matam"],"ports":["Dakar"]},"SA":{"country":"Saudi Arabia","cities":["Riyadh","Jeddah","Makkah","Medina","Tabuk"],"regions":["Ar Riyad","Makkah","Al Madinah","Tabuk"],"ports":["Jeddah","Al Jubayl","Dammam"]},"SS":{"country":"South Sudan","cities":["Malakal","Wau","Juba"],"regions":["Upper Nile","West Bahr-al-Ghazal","Central Equatoria"],"ports":[],"landlocked":true},"NL":{"country":"Netherlands","cities":["The Hague","Amsterdam"],"regions":["Zuid-Holland","Noord-Holland"],"ports":["Rotterdam","Amsterdam"]},"NO":{"country":"Norway","cities":["Oslo","Bergen","Trondheim","Kristiansand","Tromsø","Hammerfest"],"regions":["Oslo","Hordaland","Sør-Trøndelag","Vest-Agder","Troms","Finnmark"],"ports":["Larvik","Bergen","Fusa"]},"SI":{"country":"Slovenia","cities":["Ljubljana"],"regions":["Osrednjeslovenska"],"ports":["Koper"]},"SK":{"country":"Slovakia","cities":["Bratislava"],"regions":["Bratislavský"],"ports":[],"landlocked":true},"QA":{"country":"Qatar","cities":["Doha"],"regions":["Ad Dawhah"],"ports":[]},"ZA":{"country":"South Africa","cities":["Johannesburg","Cape Town","Durban","Pretoria","Port Elizabeth","Bloemfontein","Welkom","East London"],"regions":["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Orange Free State","Northern Cape"],"ports":["Cape Town","Durban","Port Elizabeth"]},"MZ":{"country":"Mozambique","cities":["Maputo","Beira","Nampula","Nacala","Quelimane","Tete","Xai-Xai","Pemba"],"regions":["Maputo","Sofala","Nampula","Zambezia","Tete","Gaza"],"ports":["Maputo","Palma"]},"PG":{"country":"Papua New Guinea","cities":["Port Moresby","Lae","Mt.  Hagen","Goroka","Rabaul"],"regions":["Central","Morobe","Western Highlands","Eastern Highlands","East New Britain"],"ports":["Lae","Rabaul"]},"PA":{"country":"Panama","cities":["Panama City","David"],"regions":["Panama","Chiriquí"],"ports":["Panama Canal","Balboa","Manzanillo"]},"MA":{"country":"Morocco","cities":["Casablanca","Rabat","Fez","Marrakesh","Oujda","Safi","Laayoune"],"regions":["Grand Casablanca","Rabat - Salé - Zemmour - Zaer","Fès - Boulemane","Marrakech - Tensift - Al Haouz","Oriental","Doukkala - Abda"],"ports":["Casablanca","Tangier","Agadir"]},"ME":{"country":"Montenegro","cities":["Podgorica"],"regions":["Podgorica"],"ports":[]},"RU":{"country":"Russia","cities":["Moscow","St.  Petersburg","Novosibirsk","Yekaterinburg","Nizhny Novgorod","Samara","Omsk","Kazan"],"regions":["Moskva","City of St. Petersburg","Novosibirsk","Sverdlovsk","Nizhegorod","Samara"],"ports":["St Petersburg","Kaliningrad"]},"LK":{"country":"Sri Lanka","cities":["Colombo","Sri Jayawardenepura Kotte","Kandy"],"regions":["Colombo","Kandy"],"ports":["Colombo","Kankesanturai","Trincomalee"]},"PH":{"country":"Philippines","cities":["Manila","Davao","General Santos","Cebu","Zamboanga","Baguio","Iloilo","Laoag"],"regions":["Metropolitan Manila","Davao Del Sur","South Cotabato","Cebu","Zamboanga del Sur","Benguet"],"ports":["Manila","General Santos City","Cebu"]},"MX":{"country":"Mexico","cities":["Mexico City","Guadalajara","Monterrey","Puebla","Tijuana","León","Torreón","San Luis Potosí"],"regions":["Distrito Federal","Jalisco","Nuevo León","Puebla","Baja California","Guanajuato"],"ports":["Ensenada","Progreso","Lazaro Cardenas"]},"PL":{"country":"Poland","cities":["Warsaw","Kraków","Gdańsk"],"regions":["Masovian","Lesser Poland","Pomeranian"],"ports":["Gdynia"]},"MN":{"country":"Mongolia","cities":["Ulaanbaatar","Erdenet","Choibalsan","Dund-Us","Dalandzadgad"],"regions":["Ulaanbaatar","Orhon","Dornod","Hovd","Ömnögovi"],"ports":[],"landlocked":true},"KP":{"country":"North Korea","cities":["Pyongyang","Wonsan","Sinuiju"],"regions":["P'yongyang","Kangwon-do","P'yongan-bukto"],"ports":[]},"TZ":{"country":"Tanzania","cities":["Dar es Salaam","Mwanza","Zanzibar","Arusha","Mbeya","Morogoro","Dodoma"],"regions":["Dar-Es-Salaam","Mwanza","Zanzibar West","Arusha","Mbeya","Morogoro"],"ports":["Dar es Salaam","Tanga","Zanzibar"]},"CH":{"country":"Switzerland","cities":["Geneva","Zürich","Bern"],"regions":["Genève","Zürich","Bern"],"ports":[],"landlocked":true},"ID":{"country":"Indonesia","cities":["Jakarta","Surabaya","Bandung","Medan","Palembang","Semarang","Makassar","Bandar Lampung"],"regions":["Jakarta Raya","Jawa Timur","Jawa Barat","Sumatera Utara","Sumatera Selatan","Jawa Tengah"],"ports":["Jakarta","Surabaya","Semarang"]},"KE":{"country":"Kenya","cities":["Nairobi","Mombasa","Eldoret","Meru"],"regions":["Nairobi","Coast","Rift Valley","Eastern"],"ports":["Mombasa"]},"MY":{"country":"Malaysia","cities":["George Town","Kuala Lumpur","Kuching","Putrajaya"],"regions":["Pulau Pinang","Selangor","Sarawak"],"ports":["Penang","Port Klang","Malacca"]},"MG":{"country":"Madagascar","cities":["Antananarivo","Fianarantsoa","Mahajanga","Toliara","Antsiranana"],"regions":["Antananarivo","Fianarantsoa","Mahajanga","Toliary","Antsiranana"],"ports":["Toamasina"]},"EC":{"country":"Ecuador","cities":["Guayaquil","Quito","Cuenca","Santa Cruz"],"regions":["Guayas","Pichincha","Azuay","Gal"],"ports":["Guayaquil","Esmeraldas"]},"CR":{"country":"Costa Rica","cities":["San José","Limón"],"regions":["San José","Limón"],"ports":["Puerto Caldera","Puerto Limon","Puerto Limon-Moin"]},"CU":{"country":"Cuba","cities":["Havana","Santiago de Cuba"],"regions":["Ciudad de la Habana","Santiago de Cuba"],"ports":["Havana Cuba","Santiago De Cuba","Caibarien"]},"DO":{"country":"Dominican Republic","cities":["Santo Domingo","Santiago"],"regions":["Distrito Nacional","Santiago"],"ports":["Caucedo"]},"CO":{"country":"Colombia","cities":["Bogota","Medellín","Cali","Barranquilla","Cartagena","Pasto","Manizales","Leticia"],"regions":["Bogota","Antioquia","Valle del Cauca","Atlántico","Bolívar","Nariño"],"ports":["Barranquilla","Buenaventura","Cartagena"]},"DM":{"country":"Dominica","cities":["Roseau"],"regions":["Saint George"],"ports":[]},"CD":{"country":"Congo (Kinshasa)","cities":["Kinshasa","Lubumbashi","Mbuji-Mayi","Kananga","Kikwit","Kisangani","Kolwezi","Butembo"],"regions":["Kinshasa City","Katanga","Kasaï-Oriental","Kasaï-Occidental","Bandundu","Orientale"],"ports":["Matadi","Boma"]},"TD":{"country":"Chad","cities":["N'Djamena","Abéché","Moundou"],"regions":["Hadjer-Lamis","Ouaddaï","Logone Oriental"],"ports":[],"landlocked":true},"EG":{"country":"Egypt","cities":["Cairo","Alexandria","Bur Said","Luxor","Suez","Asyut","El Faiyum","Aswan"],"regions":["Al Qahirah","Al Iskandariyah","Bur Sa`id","Qina","As Suways","Asyut"],"ports":["Alexandria","Port Said","Suez Canal"]},"ER":{"country":"Eritrea","cities":["Asmara","Assab"],"regions":["Anseba","Debubawi Keyih Bahri"],"ports":["Assab"]},"DJ":{"country":"Djibouti","cities":["Djibouti"],"regions":["Djibouti"],"ports":["Djibouti"]},"DE":{"country":"Germany","cities":["Berlin","Frankfurt","Hamburg","Munich","Dresden"],"regions":["Berlin","Hessen","Hamburg","Bayern","Sachsen"],"ports":["Hamburg","Bremerhaven","Sassnitz"]},"MW":{"country":"Malawi","cities":["Lilongwe","Blantyre","Mzuzu"],"regions":["Lilongwe","Blantyre","Mzimba"],"ports":[],"landlocked":true},"GT":{"country":"Guatemala","cities":["Guatemala City","Quetzaltenango"],"regions":["Guatemala","Quezaltenango"],"ports":["Puerto Quetzal","Santo Tomas de Castilla"]},"GM":{"country":"The Gambia","cities":["Banjul"],"regions":["Banjul"],"ports":["Banjul"]},"CG":{"country":"Congo (Brazzaville)","cities":["Brazzaville","Pointe-Noire","Kayes"],"regions":["Pool","Kouilou","Bouenza"],"ports":["Pointe Noire"]},"GA":{"country":"Gabon","cities":["Libreville","Port-Gentil","Franceville"],"regions":["Estuaire","Ogooué-Maritime","Haut-Ogooué"],"ports":["Libreville","Port Gentil"]},"ML":{"country":"Mali","cities":["Bamako","Ségou","Gao","Kayes","Timbuktu","Djenné"],"regions":["Bamako","Ségou","Gao","Kayes","Timbuktu","Mopti"],"ports":[],"landlocked":true},"CL":{"country":"Chile","cities":["Santiago","Concepción","Valparaíso","Antofagasta","Iquique","Arica","Puerto Montt","Valdivia"],"regions":["Región Metropolitana de Santiago","Bío-Bío","Valparaíso","Antofagasta","Tarapacá","Arica y Parinacota"],"ports":["Lirquen","San Antonio","Iquique"]},"GL":{"country":"Greenland","cities":["Nuuk","Sisimiut","Upernavik","Qaanaaq","Narsarsuaq"],"regions":["Kommuneqarfik Sermersooq","Qeqqata Kommunia","Qaasuitsup Kommunia","Kommune Kujalleq"],"ports":[]},"MR":{"country":"Mauritania","cities":["Nouakchott","Nouadhibou","Atar","Ayoun el Atrous"],"regions":["Nouakchott","Dakhlet Nouadhibou","Adrar","Hodh el Gharbi"],"ports":["Nouakchott","Nouadhibou"]},"MK":{"country":"North Macedonia","cities":["Skopje"],"regions":["Centar"],"ports":[],"landlocked":true},"LY":{"country":"Libya","cities":["Tripoli","Banghazi","Misrata","Zuwara","Sabha","Al Jawf","Tmassa"],"regions":["Tajura' wa an Nawahi al Arba","Benghazi","Misratah","An Nuqat al Khams","Sabha","Al Kufrah"],"ports":["Benghazi","Misuratah"]},"IQ":{"country":"Iraq","cities":["Baghdad","Mosul","Basra","Najaf","Kirkuk"],"regions":["Baghdad","Ninawa","Al-Basrah","An-Najaf","At-Ta'mim"],"ports":[]},"ET":{"country":"Ethiopia","cities":["Addis Ababa","Dire Dawa","Bahir Dar","Gondar","Mekele"],"regions":["Addis Ababa","Dire Dawa","Amhara","Tigray"],"ports":[],"landlocked":true},"FI":{"country":"Finland","cities":["Helsinki","Tampere","Vaasa","Rovaniemi"],"regions":["Southern Finland","Pirkanmaa","Western Finland","Lapland"],"ports":["Kotka","Rauma"]},"KZ":{"country":"Kazakhstan","cities":["Almaty","Shymkent","Qaraghandy","Taraz","Nur-Sultan","Pavlodar","Oskemen","Semey"],"regions":["Almaty","South Kazakhstan","Qaraghandy","Zhambyl","Aqmola","Pavlodar"],"ports":[],"landlocked":true},"IR":{"country":"Iran","cities":["Tehran","Mashhad","Isfahan","Tabriz","Shiraz","Ahvaz","Hamadan","Yazd"],"regions":["Tehran","Razavi Khorasan","Esfahan","East Azarbaijan","Fars","Khuzestan"],"ports":["Bandar Abbas","Chah Bahar"]},"GN":{"country":"Guinea","cities":["Conakry","Nzérékoré","Kankan"],"regions":["Conakry","Nzerekore","Kankan"],"ports":["Conakry"]},"CI":{"country":"Ivory Coast","cities":["Abidjan","Bouaké","Yamoussoukro"],"regions":["Lagunes","Vallée du Bandama","Lacs"],"ports":["Abidjan","San Pedro"]},"RE":{"country":"France","cities":["St.-Denis"],"regions":["La Réunion"],"ports":["Port Reunion"]},"BR":{"country":"Brazil","cities":["São Paulo","Rio de Janeiro","Belo Horizonte","Porto Alegre","Brasília","Recife","Fortaleza","Salvador"],"regions":["São Paulo","Rio de Janeiro","Minas Gerais","Rio Grande do Sul","Distrito Federal","Pernambuco"],"ports":["Santos","Itaguai (Sepetiba)","Pecem"]},"CA":{"country":"Canada","cities":["Toronto","Montréal","Vancouver","Ottawa","Calgary","Edmonton","Winnipeg","Québec"],"regions":["Ontario","Québec","British Columbia","Alberta","Manitoba","Nova Scotia"],"ports":["Montreal","Vancouver","Prince Rupert"]},"CF":{"country":"Central African Republic","cities":["Bangui","Bambari","Obo","N'Délé"],"regions":["Bangui","Ouaka","Haut-Mbomou","Bamingui-Bangoran"],"ports":[],"landlocked":true},"AR":{"country":"Argentina","cities":["Buenos Aires","Córdoba","Rosario","Mendoza","Tucumán","Mar del Plata","Salta","Santa Fe"],"regions":["Ciudad de Buenos Aires","Córdoba","Santa Fe","Mendoza","Tucumán","Salta"],"ports":["Buenos Aires","Zarate","Bahia Blanca"]},"BO":{"country":"Bolivia","cities":["Santa Cruz","La Paz","Sucre","Tarija","Trinidad","Riberalta"],"regions":["Santa Cruz","La Paz","Chuquisaca","Tarija","El Beni"],"ports":[],"landlocked":true},"AF":{"country":"Afghanistan","cities":["Kabul","Kandahar","Herat","Mazar-i-Sharif"],"regions":["Kabul","Kandahar","Hirat","Balkh"],"ports":[],"landlocked":true},"KH":{"country":"Cambodia","cities":["Phnom Penh","Battambang","Siem Reap"],"regions":["Phnom Penh","Batdâmbâng","Siemréab"],"ports":["Sihanoukville"]},"AO":{"country":"Angola","cities":["Luanda","Huambo","Benguela","Moçâmedes","Malanje","Lubango","Menongue"],"regions":["Luanda","Huambo","Benguela","Namibe","Malanje","Huíla"],"ports":["Luanda","Soyo","Namibe"]},"BB":{"country":"Barbados","cities":["Bridgetown"],"regions":["Saint Michael"],"ports":["Bridgetown"]},"DZ":{"country":"Algeria","cities":["Algiers","Oran","Constantine","Annaba","Ghardaia","Tamanrasset"],"regions":["Alger","Oran","Constantine","Annaba","Ghardaaa","Tamanghasset"],"ports":["Algiers","Oran","Annaba"]},"BJ":{"country":"Benin","cities":["Cotonou","Porto-Novo","Parakou"],"regions":["Ouémé","Borgou"],"ports":["Cotonou"]},"BY":{"country":"Belarus","cities":["Minsk","Brest"],"regions":["Minsk","Brest"],"ports":[],"landlocked":true},"BD":{"country":"Bangladesh","cities":["Dhaka","Chattogram","Khulna","Rajshahi"],"regions":["Dhaka","Chittagong","Khulna","Rajshahi"],"ports":["Chittagong"]},"BW":{"country":"Botswana","cities":["Gaborone","Francistown","Mahalapye","Serowe"],"regions":["South-East","Central"],"ports":[],"landlocked":true},"AU":{"country":"Australia","cities":["Sydney","Melbourne","Brisbane","Perth","Adelaide","Newcastle","Gold Coast","Canberra"],"regions":["New South Wales","Victoria","Queensland","Western Australia","South Australia","Australian Capital Territory"],"ports":["Sydney","Melbourne","Brisbane"]},"BF":{"country":"Burkina Faso","cities":["Ouagadougou","Bobo Dioulasso"],"regions":["Kadiogo","Houet"],"ports":[],"landlocked":true},"MM":{"country":"Myanmar","cities":["Yangon","Mandalay","Naypyidaw","Sittwe"],"regions":["Yangon","Mandalay","Rakhine"],"ports":[]},"BI":{"country":"Burundi","cities":["Bujumbura"],"regions":["Bujumbura Mairie"],"ports":[],"landlocked":true},"AS":{"country":"American Samoa","cities":["Pago Pago"],"regions":[],"ports":["Pago Pago"]},"VC":{"country":"Saint Vincent and the Grenadines","cities":["Kingstown"],"regions":[],"ports":[]},"LC":{"country":"Saint Lucia","cities":["Castries"],"regions":[],"ports":[]},"KN":{"country":"Saint Kitts and Nevis","cities":["Basseterre"],"regions":[],"ports":[]},"MU":{"country":"Mauritius","cities":["Port Louis"],"regions":[],"ports":["Port Louis"]},"GD":{"country":"Grenada","cities":["Saint George's"],"regions":[],"ports":[]},"PF":{"country":"French Polynesia","cities":["Papeete"],"regions":[],"ports":["Papeete"]},"BH":{"country":"Bahrain","cities":["Manama"],"regions":[],"ports":["Bahrain"]},"BS":{"country":"The Bahamas","cities":["Nassau","Freeport"],"regions":[],"ports":["Freeport Bahamas","Nassau"]},"AG":{"country":"Antigua and Barbuda","cities":["Saint John's"],"regions":[],"ports":[]},"TW":{"country":"Taiwan","cities":["Taipei","Kaohsiung","Taichung"],"regions":["Taipei City","Kaohsiung City","Taichung City"],"ports":["Keelung","Kaohsiung","Taichung"]},"NZ":{"country":"New Zealand","cities":["Auckland","Wellington","Manukau","Christchurch","Hamilton","Dunedin","Napier","Blenheim"],"regions":["Auckland","Manawatu-Wanganui","Canterbury","Waikato","Otago","Gisborne"],"ports":["Auckland","Wellington","Lyttelton"]},"AE":{"country":"United Arab Emirates","cities":["Dubai","Abu Dhabi"],"regions":["Dubay","Abu Dhabi"],"ports":["Jebel Ali","Sharjah","Abu Dhabi"]},"TL":{"country":"East Timor","cities":["Dili"],"regions":["Dili"],"ports":[]},"VU":{"country":"Vanuatu","cities":["Port Vila"],"regions":["Shefa"],"ports":[]},"HN":{"country":"Honduras","cities":["Tegucigalpa"],"regions":["Francisco Morazán"],"ports":["Puerto Cortes"]},"GY":{"country":"Guyana","cities":["Georgetown"],"regions":["East Berbice-Corentyne"],"ports":[]},"IS":{"country":"Iceland","cities":["Reykjavík"],"regions":["Suðurnes"],"ports":[]},"HT":{"country":"Haiti","cities":["Port-au-Prince"],"regions":["Ouest"],"ports":["Cap-Haitien"]},"TJ":{"country":"Tajikistan","cities":["Dushanbe"],"regions":["Tadzhikistan Territories"],"ports":[],"landlocked":true},"NI":{"country":"Nicaragua","cities":["Managua"],"regions":["Managua"],"ports":["Corinto"]},"SL":{"country":"Sierra Leone","cities":["Freetown"],"regions":["Western"],"ports":["Freetown","Pepel"]},"NP":{"country":"Nepal","cities":["Kathmandu"],"regions":["Bhaktapur"],"ports":[],"landlocked":true},"SB":{"country":"Solomon Islands","cities":["Honiara"],"regions":["Guadalcanal"],"ports":[]},"MD":{"country":"Moldova","cities":["Chișinău"],"regions":["Chisinau"],"ports":[],"landlocked":true},"SO":{"country":"Somalia","cities":["Mogadishu"],"regions":["Banaadir"],"ports":["Mogadishu"]},"OM":{"country":"Oman","cities":["Muscat"],"regions":["Muscat"],"ports":["Muscat. Oman","Sohar","Salalah"]},"GW":{"country":"Guinea Bissau","cities":["Bissau"],"regions":["Bissau"],"ports":["Bissau"]},"JO":{"country":"Jordan","cities":["Amman"],"regions":["Amman"],"ports":["Al Aqabah"]},"LT":{"country":"Lithuania","cities":["Vilnius"],"regions":["Vilniaus"],"ports":[]},"LV":{"country":"Latvia","cities":["Riga"],"regions":["Riga"],"ports":["Ventspils"]},"KG":{"country":"Kyrgyzstan","cities":["Bishkek"],"regions":["Bishkek"],"ports":[],"landlocked":true},"LS":{"country":"Lesotho","cities":["Maseru"],"regions":["Maseru"],"ports":[],"landlocked":true},"SV":{"country":"El Salvador","cities":["San Salvador"],"regions":["San Salvador"],"ports":["Acajutla"]},"JM":{"country":"Jamaica","cities":["Kingston"],"regions":["Kingston"],"ports":["Port Antonio"]},"GQ":{"country":"Equatorial Guinea","cities":["Malabo"],"regions":["Bioko Norte"],"ports":["Bata"]},"HR":{"country":"Croatia","cities":["Zagreb"],"regions":["Grad Zagreb"],"ports":[]},"EE":{"country":"Estonia","cities":["Tallinn"],"regions":["Harju"],"ports":[]},"FJ":{"country":"Fiji","cities":["Suva"],"regions":["Central"],"ports":["Suva","Lautoka"]},"GR":{"country":"Greece","cities":["Athens","Thessaloniki"],"regions":["Attiki","Kentriki Makedonia"],"ports":["Piraeus","Skaramanga","Thessaloniki"]},"LB":{"country":"Lebanon","cities":["Beirut"],"regions":["Beirut"],"ports":["Beirut"]},"LA":{"country":"Laos","cities":["Vientiane"],"regions":["Vientiane [prefecture]"],"ports":[],"landlocked":true},"BN":{"country":"Brunei","cities":["Bandar Seri Begawan"],"regions":["Brunei and Muara"],"ports":[]},"BZ":{"country":"Belize","cities":["Belmopan"],"regions":["Cayo"],"ports":["Belize"]},"AL":{"country":"Albania","cities":["Tirana"],"regions":["Durrës"],"ports":[]},"AM":{"country":"Armenia","cities":["Yerevan"],"regions":["Erevan"],"ports":[],"landlocked":true},"AZ":{"country":"Azerbaijan","cities":["Baku"],"regions":["Baki"],"ports":[],"landlocked":true},"BG":{"country":"Bulgaria","cities":["Sofia"],"regions":["Grad Sofiya"],"ports":["Varna"]},"BT":{"country":"Bhutan","cities":["Thimphu"],"regions":["Thimphu"],"ports":[],"landlocked":true},"PR":{"country":"Puerto Rico","cities":["San Juan"],"regions":[],"ports":["San Juan","Ponce"]},"FK":{"country":"Falkland Islands","cities":["Stanley"],"regions":[],"ports":[]},"BM":{"country":"Bermuda","cities":["Hamilton"],"regions":[],"ports":[]},"TO":{"country":"Tonga","cities":["Nuku'alofa"],"regions":[],"ports":[]},"SC":{"country":"Seychelles","cities":["Victoria"],"regions":[],"ports":["Victoria"]},"ST":{"country":"Sao Tome and Principe","cities":["São Tomé"],"regions":[],"ports":[]},"WS":{"country":"Samoa","cities":["Apia"],"regions":[],"ports":[]},"MT":{"country":"Malta","cities":["Valletta"],"regions":[],"ports":["Marsaxlokk"]},"MV":{"country":"Maldives","cities":["Malé"],"regions":[],"ports":[]},"IL":{"country":"Israel","cities":["Tel Aviv","Jerusalem"],"regions":["Tel Aviv","Jerusalem"],"ports":["Ashdod","Haifa"]},"CV":{"country":"Cape Verde","cities":["Praia"],"regions":[],"ports":["Praia","Mindelo","Porto Grande"]},"CY":{"country":"Cyprus","cities":["Nicosia"],"regions":[],"ports":["Limassol","Larnaca"]},"HU":{"country":"Hungary","cities":["Budapest"],"regions":["Budapest"],"ports":[],"landlocked":true},"SY":{"country":"Syria","cities":["Aleppo","Damascus"],"regions":["Aleppo (Halab)","Damascus"],"ports":["Latakia"]},"IE":{"country":"Ireland","cities":["Dublin"],"regions":["Dublin"],"ports":["Dublin","Cork. Co Cork"]},"LR":{"country":"Liberia","cities":["Monrovia"],"regions":["Montserrado"],"ports":["Monrovia","Greenville"]},"CZ":{"country":"Czechia","cities":["Prague"],"regions":["Prague"],"ports":[],"landlocked":true},"KW":{"country":"Kuwait","cities":["Kuwait City"],"regions":["Al Kuwayt"],"ports":["Ash Shuwaykh","Shuaiba"]},"GH":{"country":"Ghana","cities":["Accra"],"regions":["Greater Accra"],"ports":["Tema","Takoradi","Accra"]},"DK":{"country":"Denmark","cities":["København"],"regions":["Hovedstaden"],"ports":["Aarhus","Kobenhavn"]},"BE":{"country":"Belgium","cities":["Brussels"],"regions":["Brussels"],"ports":["Antwerp","Zeebrugge","St Georges"]},"AT":{"country":"Austria","cities":["Vienna"],"regions":["Wien"],"ports":[],"landlocked":true},"SG":{"country":"Singapore","cities":["Singapore"],"regions":[],"ports":["Singapore"]},"HK":{"country":"Hong Kong S.A.R.","cities":["Hong Kong"],"regions":[],"ports":["Hong Kong"]},"WP":{"country":"","cities":[],"regions":[],"ports":["Fazendinha","Kiel Kanal","Torres Strait"]},"AN":{"country":"","cities":[],"regions":[],"ports":["Willemstad"]},"CK":{"country":"","cities":[],"regions":[],"ports":["Avarua"]},"VI":{"country":"","cities":[],"regions":[],"ports":["Charlotte Amalie"]},"FO":{"country":"","cities":[],"regions":[],"ports":["Torshavn"]},"UM":{"country":"","cities":[],"regions":[],"ports":["Wake Island"]}};
const CURATED_MARKETS={
  SE:{
    ports:["Gothenburg","Trelleborg","Stockholm Norvik"],
    cities:["Stockholm","Gothenburg","Malmö","Uppsala","Västerås","Örebro","Linköping","Helsingborg"],
    regions:["Stockholm County","Västra Götaland","Skåne","Central Sweden"]
  },
  RE:{
    ports:["Port Est (Port Réunion)"],
    cities:["Saint-Denis","Le Port","Saint-Paul","Saint-Pierre","Saint-André","Saint-Benoît"],
    regions:["North Réunion","West Réunion","South Réunion","East Réunion"]
  },
  AE:{
    ports:["Jebel Ali","Mina Rashid","Mina Al Hamriya"],
    cities:["Dubai","Abu Dhabi","Sharjah","Ajman","Al Ain","Ras Al Khaimah"],
    regions:["Dubai","Abu Dhabi","Sharjah","Northern Emirates"]
  },
  AU:{
    ports:["Melbourne","Brisbane","Fremantle"],
    cities:["Sydney","Melbourne","Brisbane","Perth","Adelaide","Canberra","Gold Coast","Newcastle"],
    regions:["New South Wales","Victoria","Queensland","Western Australia","South Australia"]
  },
  NZ:{
    ports:["Auckland","Wellington","Lyttelton"],
    cities:["Auckland","Wellington","Christchurch","Hamilton","Tauranga","Dunedin","Palmerston North","Napier"],
    regions:["Auckland","Waikato","Wellington","Canterbury","Bay of Plenty"]
  },
  ZA:{
    ports:["Durban","Gqeberha (Port Elizabeth)","Cape Town"],
    cities:["Johannesburg","Cape Town","Durban","Pretoria","Gqeberha","Bloemfontein","East London"],
    regions:["Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape"]
  },
  US:{
    ports:["Baltimore","Jacksonville","Brunswick"],
    cities:["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego"],
    regions:["Northeast","Mid-Atlantic","Southeast","Midwest","West Coast"]
  },
  CA:{
    ports:["Halifax Autoport","Vancouver","Montreal"],
    cities:["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Halifax","Winnipeg"],
    regions:["Ontario","Quebec","British Columbia","Alberta","Atlantic Canada"]
  },
  DE:{
    ports:["Bremerhaven","Hamburg","Emden"],
    cities:["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Düsseldorf","Leipzig"],
    regions:["North Germany","North Rhine-Westphalia","Central Germany","South Germany"]
  },
  FR:{
    ports:["Le Havre","Marseille Fos","Dunkirk"],
    cities:["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Montpellier","Bordeaux"],
    regions:["Île-de-France","Northern France","Western France","Southern France"]
  },
  ES:{
    ports:["Barcelona","Valencia","Bilbao"],
    cities:["Madrid","Barcelona","Valencia","Seville","Zaragoza","Málaga","Murcia","Bilbao"],
    regions:["Catalonia","Valencian Community","Andalusia","Basque Country","Central Spain"]
  }
};

for(const [iso,override] of Object.entries(CURATED_MARKETS)){
  if(!MARKET_DATA[iso]) MARKET_DATA[iso]={cities:[],regions:[],ports:[],landlocked:false};
  if(override.cities) MARKET_DATA[iso].cities=override.cities;
  if(override.regions) MARKET_DATA[iso].regions=override.regions;
  if(override.ports) MARKET_DATA[iso].ports=override.ports;
}

const MARKET_GAPS={
  AI:{cities:["The Valley","Sandy Ground","Blowing Point"],regions:["Anguilla"],ports:["Road Bay"],country:"Anguilla"},
  BS:{cities:["Nassau","Freeport","Marsh Harbour"],regions:["New Providence","Grand Bahama","Abaco"],ports:["Nassau","Freeport"],country:"The Bahamas"},
  CZ:{cities:["Prague","Brno","Ostrava","Plzeň"],regions:["Prague","South Moravia","Moravian-Silesian Region"],ports:[],landlocked:true,country:"Czech Republic"},
  GM:{cities:["Banjul","Serekunda","Brikama"],regions:["Greater Banjul Area","West Coast Region"],ports:["Banjul"],country:"The Gambia"},
  GP:{cities:["Les Abymes","Pointe-à-Pitre","Basse-Terre"],regions:["Grande-Terre","Basse-Terre"],ports:["Jarry / Guadeloupe Port Caraïbes"],country:"Guadeloupe"},
  MQ:{cities:["Fort-de-France","Le Lamentin","Le Robert"],regions:["Central Martinique","North Martinique","South Martinique"],ports:["Fort-de-France"],country:"Martinique"},
  FM:{cities:["Palikir","Kolonia","Weno"],regions:["Pohnpei","Chuuk","Yap","Kosrae"],ports:["Pohnpei","Weno / Chuuk"],country:"Micronesia"},
  MS:{cities:["Brades","Little Bay","Salem"],regions:["Northern Montserrat"],ports:["Little Bay"],country:"Montserrat"},
  NR:{cities:["Yaren","Aiwo","Denigomodu"],regions:["Nauru"],ports:["Aiwo"],country:"Nauru"},
  TL:{cities:["Dili","Baucau","Maliana"],regions:["Dili","Baucau","Bobonaro"],ports:["Dili"],country:"Timor-Leste"},
  VG:{cities:["Road Town","Spanish Town"],regions:["Tortola","Virgin Gorda"],ports:["Port Purcell / Road Town"],country:"British Virgin Islands"},
  XK:{cities:["Pristina","Prizren","Peja","Gjakova"],regions:["Pristina District","Prizren District"],ports:[],landlocked:true,country:"Kosovo"},
  MP:{cities:["Saipan","Garapan","Tinian"],regions:["Saipan","Tinian","Rota"],ports:["Saipan"],country:"Northern Mariana Islands"},
  BL:{cities:["Gustavia","Saint-Jean"],regions:["Saint Barthélemy"],ports:["Gustavia"],country:"Saint Barthélemy"},
  MF:{cities:["Marigot","Grand Case"],regions:["French Saint-Martin"],ports:["Galisbay / Marigot"],country:"Saint Martin"},
  SX:{cities:["Philipsburg","Simpson Bay"],regions:["Sint Maarten"],ports:["Port St Maarten / Philipsburg"],country:"Sint Maarten"},
  VI:{cities:["Charlotte Amalie","Christiansted","Frederiksted"],regions:["St Thomas","St Croix","St John"],ports:["Crown Bay / Charlotte Amalie","Frederiksted"],country:"U.S. Virgin Islands"},

  AL:{ports:["Durrës","Vlorë"]},
  AG:{ports:["St John's"]},
  BM:{ports:["Hamilton"]},
  BA:{ports:["Ploče (Croatia) – regional overland gateway"]},
  BN:{ports:["Muara"]},
  KY:{ports:["George Town"]},
  KM:{ports:["Moroni","Mutsamudu"]},
  HR:{ports:["Rijeka","Ploče","Split"]},
  CW:{ports:["Willemstad"]},
  DM:{ports:["Roseau","Portsmouth"]},
  EE:{ports:["Muuga / Port of Tallinn","Paldiski"]},
  FK:{ports:["Stanley"]},
  GF:{ports:["Dégrad des Cannes"]},
  GL:{ports:["Nuuk"]},
  GD:{ports:["St George's"]},
  GY:{ports:["Georgetown"]},
  IS:{ports:["Reykjavík"]},
  IQ:{ports:["Umm Qasr"]},
  KI:{ports:["Betio / Tarawa"]},
  LT:{ports:["Klaipėda"]},
  MO:{ports:["Macau / regional freight gateway"]},
  MV:{ports:["Malé"]},
  MH:{ports:["Majuro"]},
  MC:{ports:["Nice (France) – regional freight gateway"]},
  ME:{ports:["Bar"]},
  MM:{ports:["Yangon / Thilawa"]},
  PW:{ports:["Malakal / Koror"]},
  QA:{ports:["Hamad Port"]},
  KN:{ports:["Basseterre"]},
  LC:{ports:["Castries","Vieux Fort"]},
  VC:{ports:["Kingstown"]},
  WS:{ports:["Apia"]},
  ST:{ports:["São Tomé"]},
  SB:{ports:["Honiara"]},
  SD:{ports:["Port Sudan"]},
  TO:{ports:["Nuku'alofa"]},
  TC:{ports:["South Dock / Providenciales"]},
  VU:{ports:["Port Vila","Luganville"]},
  KP:{routeOnly:true,routeNote:"Any proposed export route to North Korea requires specific legal, sanctions and carrier-compliance review before AnyBike can proceed."},
  PS:{routeOnly:true,routeNote:"Destination freight routing for Palestine must be confirmed case-by-case with the appointed freight forwarder because available receiving routes and border procedures can change."}
};

for(const [iso,override] of Object.entries(MARKET_GAPS)){
  if(!MARKET_DATA[iso]) MARKET_DATA[iso]={country:override.country||"",cities:[],regions:[],ports:[],landlocked:false};
  if(override.country) MARKET_DATA[iso].country=override.country;
  if(override.cities) MARKET_DATA[iso].cities=override.cities;
  if(override.regions) MARKET_DATA[iso].regions=override.regions;
  if(override.ports) MARKET_DATA[iso].ports=override.ports;
  if(override.landlocked) MARKET_DATA[iso].landlocked=true;
  if(override.routeOnly) MARKET_DATA[iso].routeOnly=true;
  if(override.routeNote) MARKET_DATA[iso].routeNote=override.routeNote;
}

const SLUG_TO_ISO={"usa":"US","uae":"AE","turkiye":"TR","ivory-coast":"CI","democratic-republic-of-the-congo":"CD","republic-of-the-congo":"CG","south-korea":"KR","north-korea":"KP","laos":"LA","taiwan":"TW","palestine":"PS","reunion":"RE","curacao":"CW","saint-barthelemy":"BL","saint-martin":"MF","sint-maarten":"SX","us-virgin-islands":"VI","british-virgin-islands":"VG","turks-and-caicos-islands":"TC","falkland-islands":"FK","french-guiana":"GF","french-polynesia":"PF","northern-mariana-islands":"MP","cabo-verde":"CV","hong-kong":"HK","macau":"MO","puerto-rico":"PR","guam":"GU","bermuda":"BM","cayman-islands":"KY","new-caledonia":"NC","kosovo":"XK","uganda":"UG","italy":"IT","aland":"AX","vatican":"VA","france":"RE","antarctica":"AQ","zambia":"ZM","namibia":"NA","japan":"JP","serbia":"RS","bosnia-and-herzegovina":"BA","isle-of-man":"IM","san-marino":"SM","aruba":"AW","liechtenstein":"LI","gibraltar":"GI","eswatini":"SZ","united-kingdom":"GB","svalbard-and-jan-mayen-islands":"SJ","luxembourg":"LU","georgia":"GE","portugal":"PT","sudan":"SD","federated-states-of-micronesia":"FM","marshall-islands":"MH","tuvalu":"TV","palau":"PW","western-sahara":"EH","monaco":"MC","kiribati":"KI","comoros":"KM","macau-s-a-r":"MO","andorra":"AD","united-states-of-america":"US","pakistan":"PK","nigeria":"NG","china":"CN","india":"IN","uruguay":"UY","venezuela":"VE","trinidad-and-tobago":"TT","togo":"TG","tunisia":"TN","yemen":"YE","ukraine":"UA","turkmenistan":"TM","uzbekistan":"UZ","vietnam":"VN","zimbabwe":"ZW","cameroon":"CM","turkey":"TR","rwanda":"RW","suriname":"SR","spain":"ES","niger":"NE","romania":"RO","sweden":"SE","thailand":"TH","peru":"PE","paraguay":"PY","senegal":"SN","saudi-arabia":"SA","south-sudan":"SS","netherlands":"NL","norway":"NO","slovenia":"SI","slovakia":"SK","qatar":"QA","south-africa":"ZA","mozambique":"MZ","papua-new-guinea":"PG","panama":"PA","morocco":"MA","montenegro":"ME","russia":"RU","sri-lanka":"LK","philippines":"PH","mexico":"MX","poland":"PL","mongolia":"MN","tanzania":"TZ","switzerland":"CH","indonesia":"ID","kenya":"KE","malaysia":"MY","madagascar":"MG","ecuador":"EC","costa-rica":"CR","cuba":"CU","dominican-republic":"DO","colombia":"CO","dominica":"DM","congo-kinshasa":"CD","chad":"TD","egypt":"EG","eritrea":"ER","djibouti":"DJ","germany":"DE","malawi":"MW","guatemala":"GT","the-gambia":"GM","congo-brazzaville":"CG","gabon":"GA","mali":"ML","chile":"CL","greenland":"GL","mauritania":"MR","north-macedonia":"MK","libya":"LY","iraq":"IQ","ethiopia":"ET","finland":"FI","kazakhstan":"KZ","iran":"IR","guinea":"GN","brazil":"BR","canada":"CA","central-african-republic":"CF","argentina":"AR","bolivia":"BO","afghanistan":"AF","cambodia":"KH","angola":"AO","barbados":"BB","algeria":"DZ","benin":"BJ","belarus":"BY","bangladesh":"BD","botswana":"BW","australia":"AU","burkina-faso":"BF","myanmar":"MM","burundi":"BI","american-samoa":"AS","saint-vincent-and-the-grenadines":"VC","saint-lucia":"LC","saint-kitts-and-nevis":"KN","mauritius":"MU","grenada":"GD","bahrain":"BH","the-bahamas":"BS","antigua-and-barbuda":"AG","new-zealand":"NZ","united-arab-emirates":"AE","east-timor":"TL","vanuatu":"VU","honduras":"HN","guyana":"GY","iceland":"IS","haiti":"HT","tajikistan":"TJ","nicaragua":"NI","sierra-leone":"SL","nepal":"NP","solomon-islands":"SB","moldova":"MD","somalia":"SO","oman":"OM","guinea-bissau":"GW","jordan":"JO","lithuania":"LT","latvia":"LV","kyrgyzstan":"KG","lesotho":"LS","el-salvador":"SV","jamaica":"JM","equatorial-guinea":"GQ","croatia":"HR","estonia":"EE","fiji":"FJ","greece":"GR","lebanon":"LB","brunei":"BN","belize":"BZ","albania":"AL","armenia":"AM","azerbaijan":"AZ","bulgaria":"BG","bhutan":"BT","tonga":"TO","seychelles":"SC","sao-tome-and-principe":"ST","samoa":"WS","malta":"MT","maldives":"MV","israel":"IL","cape-verde":"CV","cyprus":"CY","hungary":"HU","syria":"SY","ireland":"IE","liberia":"LR","czechia":"CZ","kuwait":"KW","ghana":"GH","denmark":"DK","belgium":"BE","austria":"AT","singapore":"SG","hong-kong-s-a-r":"HK"};
Object.assign(SLUG_TO_ISO,{
  "anguilla":"AI","bahamas":"BS","czech-republic":"CZ","gambia":"GM","guadeloupe":"GP",
  "martinique":"MQ","micronesia":"FM","montserrat":"MS","nauru":"NR","timor-leste":"TL",
  "british-virgin-islands":"VG","kosovo":"XK","northern-mariana-islands":"MP",
  "saint-barthelemy":"BL","saint-martin":"MF","sint-maarten":"SX","us-virgin-islands":"VI"
});
const DEMONYM={"SE":"Swedish","DE":"German","FR":"French","ES":"Spanish","IT":"Italian","IE":"Irish","NL":"Dutch","BE":"Belgian","DK":"Danish","NO":"Norwegian","FI":"Finnish","PT":"Portuguese","AT":"Austrian","CH":"Swiss","PL":"Polish","CZ":"Czech","SK":"Slovak","HU":"Hungarian","RO":"Romanian","BG":"Bulgarian","HR":"Croatian","SI":"Slovenian","GR":"Greek","CY":"Cypriot","MT":"Maltese","US":"American","CA":"Canadian","AU":"Australian","NZ":"New Zealand","AE":"Emirati","SA":"Saudi","QA":"Qatari","KW":"Kuwaiti","OM":"Omani","BH":"Bahraini","ZA":"South African","KE":"Kenyan","NG":"Nigerian","MA":"Moroccan","EG":"Egyptian","IN":"Indian","PK":"Pakistani","BD":"Bangladeshi","JP":"Japanese","KR":"South Korean","SG":"Singaporean","MY":"Malaysian","ID":"Indonesian","TH":"Thai","PH":"Filipino","VN":"Vietnamese","CN":"Chinese","HK":"Hong Kong","TW":"Taiwanese","BR":"Brazilian","AR":"Argentinian","CL":"Chilean","CO":"Colombian","MX":"Mexican","PE":"Peruvian","UY":"Uruguayan","PR":"Puerto Rican","RE":"Réunion"};
const GENERIC_TOKENS=new Set(["freight forwarder","shipping company","uk port","warehouse / depot","destination port","customs clearance","import requirements","onward delivery","uk collection","secure transport","handover","available documents"]);

function esc(v){return String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function currentSlug(){const m=location.pathname.match(/\/markets\/([^/]+)\.html/i);return m?m[1].toLowerCase():"";}
function countryName(){return (document.querySelector(".country-line strong")?.textContent||"").trim()||currentSlug().replace(/-/g," ").replace(/\b\w/g,m=>m.toUpperCase());}
function isoForPage(){
  const flag=document.querySelector('.country-flag img[src*="flagcdn.com"]');
  const fm=flag?.getAttribute("src")?.match(/\/([a-z]{2})\.png/i);
  if(fm)return fm[1].toUpperCase();
  return SLUG_TO_ISO[currentSlug()]||"";
}
function buyerPhrase(iso,name){const d=DEMONYM[iso];return d?d+" buyers":"buyers in "+name;}
function regexEscape(s){return String(s).replace(/[.*+?^$()|[\]\\{}]/g,"\\$&");}
function replaceEnglishBuyerCopy(iso,name){
  const phrase=buyerPhrase(iso,name), escaped=regexEscape(name);
  document.querySelectorAll(".eyebrow,h1,h2,h3,p,small,span").forEach(el=>{
    if(el.closest("script,style"))return;
    let html=el.innerHTML;
    const before=html;
    html=html.replace(new RegExp("UK motorcycle sourcing for "+escaped+" buyers","gi"),"UK motorcycle sourcing for "+phrase);
    html=html.replace(new RegExp("Why "+escaped+" buyers choose AnyBike","gi"),"Why "+phrase+" choose AnyBike");
    html=html.replace(new RegExp(escaped+" buyers","gi"),phrase);
    if(html!==before)el.innerHTML=html;
  });
}
function fixFlag(iso,name){
  if(!iso)return;
  const host=document.querySelector(".country-flag");
  if(!host)return;
  host.innerHTML='<img src="https://flagcdn.com/w160/'+iso.toLowerCase()+'.png" srcset="https://flagcdn.com/w320/'+iso.toLowerCase()+'.png 2x" alt="'+esc(name)+' flag" style="width:100%;height:100%;object-fit:cover;display:block">';
  host.setAttribute("aria-label",name+" flag");
  host.dataset.anybikeFlagReady="true";
  host.style.visibility="visible";
}
function fixHeroAlt(name){const img=document.querySelector(".hero-bike,.hero-media img");if(img)img.alt="Motorcycle sourcing and export support for buyers in "+name;}
function hasRealLocalBlock(){
  const cards=[...document.querySelectorAll(".port-grid .port-card,.port-grid article")];
  let real=0;
  cards.forEach(function(card){
    const heading=(card.querySelector("h3")?.textContent||"").trim().toLowerCase();
    const body=(card.textContent||"").toLowerCase();
    const ukHandover=
      heading.includes("uk handover") ||
      heading.includes("uk collection") ||
      heading.includes("shipping / delivery options") ||
      (body.includes("southampton") && body.includes("tilbury") && body.includes("bristol"));
    if(ukHandover)return;

    const local=[...card.querySelectorAll(".area-list span,.area-list a")]
      .map(x=>x.textContent.replace(/↗/g,"").trim())
      .filter(Boolean)
      .filter(s=>!GENERIC_TOKENS.has(s.toLowerCase()));

    real+=local.length;
  });
  return real>=3;
}
function localSection(meta,name){
  const cities=(meta.cities||[]).slice(0,8);
  const regions=(meta.regions||[]).filter(x=>!cities.includes(x)).slice(0,6);
  const ports=(meta.ports||[]).slice(0,3);
  const mapChip=(label,query)=>'<a href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query)+'" target="_blank" rel="noopener noreferrer" title="View '+esc(label)+' on a map">'+esc(label)+' ↗</a>';
  const chips=arr=>arr.map(x=>mapChip(x,x+', '+name)).join("");
  const portChips=ports.map(x=>'<a href="/freight-forwarders.html?port='+encodeURIComponent(x)+'" title="Find shipping information for '+esc(x)+'">'+esc(x)+' →</a>').join("");
  const gatewayText=meta.routeOnly
    ? esc(meta.routeNote||('The destination freight route for '+name+' must be confirmed case-by-case before purchase.'))
    : meta.landlocked
      ? esc(name)+' is landlocked, so international motorcycle freight normally continues overland from a port or freight gateway in a neighbouring country. Your freight forwarder should confirm the exact sea/road route, customs transit and final delivery point before purchase.'
      : ports.length
        ? 'These are established freight gateways for '+esc(name)+'. Motorcycle acceptance, sailing schedules, RoRo/container availability and final customs arrangements must still be confirmed with your appointed freight provider.'
        : 'Your appointed freight forwarder should confirm the most suitable destination port, RoRo terminal or freight gateway for '+esc(name)+', together with current vehicle acceptance and customs requirements.';
  const gatewayChips=meta.routeOnly
    ? '<a href="/freight-forwarders.html">Route &amp; compliance review →</a>'
    : meta.landlocked
      ? '<span>Overland freight</span><span>Customs transit</span><span>Neighbouring-country gateway</span>'
      : (portChips||'<a href="/freight-forwarders.html">Destination gateway to confirm →</a>');

  return '<section class="section anybike-market-local-standard"><div class="wrap">'+
    '<div class="section-head"><div class="eyebrow">Local destination planning</div><h2>Cities, regions and freight gateways for '+esc(name)+'.</h2><p>Tell AnyBike the final city or region for your motorcycle. We coordinate the UK collection and delivery to port; your appointed freight provider confirms the international route, destination handling and local import requirements.</p></div>'+
    '<div class="port-grid">'+
      '<article class="port-card"><h3>Key cities &amp; buyer areas</h3><p>Useful destination context for sourcing, freight planning and onward delivery.</p><div class="area-list">'+(chips(cities)||'<span>'+esc(name)+'</span>')+'</div></article>'+
      (regions.length?'<article class="port-card"><h3>Regions &amp; surrounding areas</h3><p>Regional context can help the freight forwarder plan onward delivery beyond the principal cities.</p><div class="area-list">'+chips(regions)+'</div></article>':'')+
      '<article class="port-card"><h3>'+(meta.routeOnly?'Route &amp; compliance review':meta.landlocked?'Landlocked freight route':'Ports &amp; freight gateways')+'</h3><p>'+gatewayText+'</p><div class="area-list anybike-gateway-list">'+gatewayChips+'</div></article>'+
      '<article class="port-card"><h3>UK Port Delivery</h3><p>AnyBike can arrange delivery to the agreed UK port, freight forwarder or approved shipping point for your deal.</p><div class="area-list">'+
        '<a href="/export-services.html">UK Port Delivery →</a>'+
        '<a href="/freight-forwarders.html">Freight Forwarder →</a>'+
        '<a href="/freight-forwarders.html">Approved Shipping Point →</a>'+
        '<a href="/export-services.html">Deal Documents →</a>'+
      '</div></article>'+
    '</div></div></section>';
}
function installLocalSection(meta,name){
  if(!meta)return;
  const authoritative=document.querySelector(".anybike-market-local-standard");
  if(authoritative){
    const expected=localSection(meta,name);
    if(authoritative.outerHTML!==expected) authoritative.outerHTML=expected;
    return;
  }
  if(hasRealLocalBlock())return;

  const grids=[...document.querySelectorAll(".port-grid")];
  const destinationGrid=grids.find(function(grid){
    const text=(grid.textContent||"").toLowerCase();
    return !(text.includes("southampton") && text.includes("tilbury") && text.includes("bristol"));
  });

  if(destinationGrid){
    const section=destinationGrid.closest(".section");
    if(section){section.outerHTML=localSection(meta,name);return;}
  }

  const handoverSection=[...document.querySelectorAll(".section")].find(function(section){
    const text=(section.textContent||"").toLowerCase();
    return text.includes("uk handover") || (text.includes("southampton") && text.includes("tilbury") && text.includes("bristol"));
  });
  if(handoverSection){
    handoverSection.insertAdjacentHTML("beforebegin",localSection(meta,name));
    return;
  }

  const faq=document.querySelector(".faq");
  const faqSection=faq?.closest(".section");
  if(faqSection){faqSection.insertAdjacentHTML("beforebegin",localSection(meta,name));return;}
  const footer=document.querySelector("footer");
  if(footer)footer.insertAdjacentHTML("beforebegin",localSection(meta,name));
}
function enhanceExistingLocalLinks(name,meta){
  document.querySelectorAll(".port-grid .port-card,.port-grid article").forEach(function(card){
    if(card.closest(".anybike-market-local-standard"))return;
    const heading=(card.querySelector("h3")?.textContent||"").toLowerCase();
    const isPortCard=heading.includes("port")||heading.includes("gateway")||heading.includes("shipping");
    card.querySelectorAll(".area-list span").forEach(function(span){
      const label=span.textContent.trim();
      if(!label||GENERIC_TOKENS.has(label.toLowerCase()))return;
      const a=document.createElement("a");
      a.textContent=label+(isPortCard?" →":" ↗");
      a.title=isPortCard?"View shipping information for "+label:"View "+label+" on a map";
      a.href=isPortCard?"/freight-forwarders.html?port="+encodeURIComponent(label):"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(label+", "+name);
      if(!isPortCard){a.target="_blank";a.rel="noopener noreferrer";}
      span.replaceWith(a);
    });
  });
}

function styleEnhancements(){
  if(document.getElementById("anybike-market-standard-css"))return;
  const s=document.createElement("style");
  s.id="anybike-market-standard-css";
  s.textContent='.anybike-market-local-standard .port-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.anybike-market-local-standard .port-card{min-height:0}.anybike-market-local-standard .anybike-gateway-list{display:flex;flex-wrap:wrap;gap:7px}.anybike-market-local-standard .area-list a{display:inline-flex;align-items:center;padding:7px 10px;border:1px solid rgba(255,255,255,.10);border-radius:999px;background:#1a1a1a;color:#ddd;font-size:12px;font-weight:850;text-decoration:none;transition:.16s ease}.anybike-market-local-standard .area-list a:hover{border-color:#ed1c24;transform:translateY(-1px)}@media(min-width:1450px){.anybike-market-local-standard .port-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:760px){.anybike-market-local-standard .port-grid{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}
function run(){
  if(!location.pathname.toLowerCase().includes("/markets/"))return;
  const name=countryName(),iso=isoForPage(),meta=MARKET_DATA[iso]||{cities:[],regions:[],ports:[],landlocked:false};
  styleEnhancements();
  replaceEnglishBuyerCopy(iso,name);
  fixFlag(iso,name);
  fixHeroAlt(name);
  installLocalSection(meta,name);
  enhanceExistingLocalLinks(name,meta);
}
window.AnyBikeMarketStandardisation={run:run};

let rerunTimer=null;
function scheduleRerun(){
  clearTimeout(rerunTimer);
  rerunTimer=setTimeout(run,30);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run);else run();

const observer=new MutationObserver(function(mutations){
  const relevant=mutations.some(function(m){
    const el=m.target?.nodeType===1?m.target:m.target?.parentElement;
    return el && !el.closest("script,style") && (el.closest(".hero,.section,.country-line") || el.matches?.(".eyebrow,h1,h2,h3,p,small,span"));
  });
  if(relevant)scheduleRerun();
});
if(document.body)observer.observe(document.body,{subtree:true,childList:true,characterData:true});
else document.addEventListener("DOMContentLoaded",function(){
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
});
})();