package com.diwana.config;

import com.diwana.company.Company;
import com.diwana.company.CompanyRepository;
import com.diwana.customsoffice.CustomsOffice;
import com.diwana.customsoffice.CustomsOfficeRepository;
import com.diwana.documenttype.DocumentType;
import com.diwana.documenttype.DocumentTypeRepository;
import com.diwana.hscode.HsCode;
import com.diwana.hscode.HsCodeRepository;
import com.diwana.aimodel.AiModel;
import com.diwana.aimodel.AiModelRepository;
import com.diwana.job.JobConfig;
import com.diwana.job.JobConfigRepository;
import com.diwana.origin.Origin;
import com.diwana.origin.OriginRepository;
import com.diwana.tariff.TariffRate;
import com.diwana.tariff.TariffRateRepository;
import com.diwana.user.User;
import com.diwana.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    @Value("${diwana.mode:prod}")
    private String mode;

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final TariffRateRepository tariffRateRepository;
    private final OriginRepository originRepository;
    private final CustomsOfficeRepository customsOfficeRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final HsCodeRepository hsCodeRepository;
    private final JobConfigRepository jobConfigRepository;
    private final AiModelRepository aiModelRepository;
    private final AiKeyLoader aiKeyLoader;

    public DataSeeder(PasswordEncoder passwordEncoder,
                      UserRepository userRepository,
                      CompanyRepository companyRepository,
                      TariffRateRepository tariffRateRepository,
                      OriginRepository originRepository,
                      CustomsOfficeRepository customsOfficeRepository,
                      DocumentTypeRepository documentTypeRepository,
                      HsCodeRepository hsCodeRepository,
                      JobConfigRepository jobConfigRepository,
                      AiModelRepository aiModelRepository,
                      AiKeyLoader aiKeyLoader) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.tariffRateRepository = tariffRateRepository;
        this.originRepository = originRepository;
        this.customsOfficeRepository = customsOfficeRepository;
        this.documentTypeRepository = documentTypeRepository;
        this.hsCodeRepository = hsCodeRepository;
        this.jobConfigRepository = jobConfigRepository;
        this.aiModelRepository = aiModelRepository;
        this.aiKeyLoader = aiKeyLoader;
    }

    @Override
    public void run(String... args) {
        if (!"dev".equals(mode)) {
            return;
        }

        seedCompanies();
        seedOrigins();
        seedCustomsOffices();
        seedDocumentTypes();
        seedHsCodes();
        seedTariffRates();
        seedJobConfigs();
        seedAiModels();
        seedUsers();
    }

    // ---- Companies ----

    private void seedCompanies() {
        if (companyRepository.count() > 0) return;

        List<Company> companies = List.of(
            createCompany("Société Marocaine d'Import-Export", "SMIE",
                "Société spécialisée dans l'import-export de produits alimentaires et industriels.",
                "00123456700015", "123456", "15, Rue Ibn Sina, Casablanca 20000"),
            createCompany("Agadir Fruits & Légumes", "AFL",
                "Coopérative d'exportation de fruits et légumes frais depuis la région du Souss.",
                "00123456800021", "789012", "Zone Industrielle d'Agadir, Agadir 80000"),
            createCompany("Casablanca Logistics Group", "CLG",
                "Opérateur logistique et transitaire basé au port de Casablanca.",
                "00123456900038", "345678", "Quai des Phosphates, Port de Casablanca 20250")
        );

        companyRepository.saveAll(companies);
    }

    private Company createCompany(String name, String key, String description, String ice, String rc, String address) {
        Company company = new Company();
        company.setName(name);
        company.setKey(key);
        company.setDescription(description);
        company.setIce(ice);
        company.setRc(rc);
        company.setAddress(address);
        company.setActive(true);
        return company;
    }

    // ---- Customs Offices ----

    private void seedCustomsOffices() {
        if (customsOfficeRepository.count() > 0) return;

        List<CustomsOffice> offices = List.of(
            new CustomsOffice("CASA-P", "Port de Casablanca"),
            new CustomsOffice("CASA-A", "Aéroport de Casablanca - Mohammed V"),
            new CustomsOffice("TANGER-P", "Port de Tanger Med"),
            new CustomsOffice("TANGER-V", "Port de Tanger Ville"),
            new CustomsOffice("AGADIR-P", "Port d'Agadir"),
            new CustomsOffice("SAFI-P", "Port de Safi"),
            new CustomsOffice("KENITRA-P", "Port de Kénitra"),
            new CustomsOffice("RABAT-A", "Aéroport de Rabat - Salé"),
            new CustomsOffice("NADOR-P", "Port de Nador"),
            new CustomsOffice("OUJDA-A", "Aéroport d'Oujda - Angads"),
            new CustomsOffice("FES-A", "Aéroport de Fès - Saïss"),
            new CustomsOffice("MARRAKECH-A", "Aéroport de Marrakech - Ménara"),
            new CustomsOffice("ESSAOUIRA-P", "Port d'Essaouira"),
            new CustomsOffice("ELJADIDA-P", "Port d'El Jadida"),
            new CustomsOffice("LAAYOUNE-A", "Aéroport de Laâyoune - Hassan I"),
            new CustomsOffice("DAKHLA-A", "Aéroport de Dakhla"),
            new CustomsOffice("TETOUAN-A", "Aéroport de Tétouan - Sania R'mel"),
            new CustomsOffice("ERRACHIDIA-A", "Aéroport d'Errachidia - Moulay Ali Cherif"),
            new CustomsOffice("OUARZAZATE-A", "Aéroport d'Ouarzazate - Moulay Ali Cherif"),
            new CustomsOffice("ALHOCEIMA-P", "Port d'Al Hoceima")
        );

        customsOfficeRepository.saveAll(offices);
    }

    // ---- Document Types ----

    private void seedDocumentTypes() {
        if (documentTypeRepository.count() > 0) return;

        List<DocumentType> docTypes = List.of(
            createDocType("COMMERCIAL_INVOICE", "Commercial Invoice", "Invoice from the supplier for goods purchased", "*", 1),
            createDocType("CERTIFICATE_OF_ORIGIN", "Certificate of Origin", "Certifies the country where goods were manufactured", "*", 2),
            createDocType("PACKING_LIST", "Packing List", "Detailed list of items in each package/shipment", null, null)
        );

        documentTypeRepository.saveAll(docTypes);
    }

    private DocumentType createDocType(String code, String name, String description, String mandatoryFor, Integer importOrder) {
        DocumentType docType = new DocumentType();
        docType.setCode(code);
        docType.setName(name);
        docType.setDescription(description);
        docType.setMandatoryFor(mandatoryFor);
        docType.setImportOrder(importOrder);
        docType.setActive(true);
        return docType;
    }

    // ---- HS Codes (WCO Harmonized System reference) ----

    private void seedHsCodes() {
        if (hsCodeRepository.count() > 0) return;

        List<HsCode> codes = List.of(
            // Live animals & meat (Ch 01-02)
            createHsCode("0101.21", "Horses, for racing", "01"),
            createHsCode("0201.10", "Meat of bovine animals, fresh or chilled, carcasses and half-carcasses", "02"),
            createHsCode("0202.20", "Meat of bovine animals, frozen, boneless", "02"),
            createHsCode("0207.14", "Cuts of poultry, frozen", "02"),

            // Fish & dairy (Ch 03-04)
            createHsCode("0304.89", "Fish fillets, frozen, n.e.c.", "03"),
            createHsCode("0402.21", "Milk and cream, concentrated/containing added sugar, in powder, fat <= 1.5%", "04"),

            // Fruit, vegetables, coffee (Ch 07-09)
            createHsCode("0703.10", "Onions and shallots, fresh or chilled", "07"),
            createHsCode("0803.90", "Bananas, fresh or dried (other than plantains)", "08"),
            createHsCode("0805.10", "Oranges, fresh or dried", "08"),
            createHsCode("0806.10", "Grapes, fresh or dried", "08"),
            createHsCode("0901.11", "Coffee, not roasted, not decaffeinated", "09"),

            // Cereals (Ch 10)
            createHsCode("1001.19", "Common wheat and meslin (other than seed)", "10"),
            createHsCode("1005.10", "Maize (corn) seed", "10"),
            createHsCode("1005.90", "Maize (corn), other than seed", "10"),
            createHsCode("1006.30", "Rice, semi-milled or wholly milled", "10"),
            createHsCode("1007.00", "Grain sorghum", "10"),

            // Fats & oils (Ch 15)
            createHsCode("1507.10", "Soya-bean oil, crude", "15"),
            createHsCode("1509.10", "Olive oil, virgin", "15"),
            createHsCode("1511.10", "Palm oil, crude", "15"),

            // Beverages (Ch 22)
            createHsCode("2203.00", "Beer made from malt", "22"),
            createHsCode("2204.21", "Wine of fresh grapes, in containers <= 2 L", "22"),

            // Mineral fuels (Ch 25-27)
            createHsCode("2523.10", "Cement clinkers", "25"),
            createHsCode("2601.11", "Iron ores and concentrates, non-agglomerated", "26"),
            createHsCode("2603.00", "Copper ores and concentrates", "26"),
            createHsCode("2701.11", "Coal, whether or not pulverised, not agglomerated", "27"),
            createHsCode("2704.00", "Coke and semi-coke of coal, of lignite or of peat", "27"),
            createHsCode("2709.00", "Petroleum oils, crude", "27"),
            createHsCode("2710.12", "Light petroleum oils and preparations, containing >= 90% petroleum oils", "27"),
            createHsCode("2710.19", "Medium petroleum oils and preparations, n.e.c.", "27"),
            createHsCode("2711.11", "Natural gas, liquefied", "27"),
            createHsCode("2711.12", "Propane, liquefied", "27"),
            createHsCode("2711.13", "Butanes, liquefied", "27"),
            createHsCode("2711.21", "Natural gas, in gaseous state", "27"),
            createHsCode("2713.20", "Petroleum coke", "27"),
            createHsCode("2716.00", "Electrical energy", "27"),

            // Chemicals & pharmaceuticals (Ch 28-38)
            createHsCode("2814.10", "Ammonia, anhydrous", "28"),
            createHsCode("2815.11", "Sodium hydroxide (caustic soda), solid", "28"),
            createHsCode("2905.11", "Methanol (methyl alcohol)", "29"),
            createHsCode("2933.39", "Heterocyclic compounds with nitrogen hetero-atom(s) only, n.e.c.", "29"),
            createHsCode("2941.10", "Penicillins and their derivatives", "29"),
            createHsCode("3004.90", "Medicaments, put up in measured doses, n.e.c.", "30"),
            createHsCode("3102.10", "Urea, whether or not in aqueous solution", "31"),
            createHsCode("3105.10", "Fertilisers in tablets or similar forms, or in packages <= 10 kg", "31"),
            createHsCode("3105.20", "Mineral or chemical fertilisers containing nitrogen, phosphorus and potassium", "31"),
            createHsCode("3204.11", "Synthetic organic colouring matter and preparations based thereon", "32"),
            createHsCode("3401.11", "Soap in bars, slabs or moulded shapes", "34"),
            createHsCode("3402.11", "Organic surface-active agents, soap, n.e.c.", "34"),
            createHsCode("3824.99", "Prepared chemical products, n.e.c.", "38"),

            // Plastics & rubber (Ch 39-40)
            createHsCode("3901.10", "Polyethylene having a specific gravity < 0.94, in primary forms", "39"),
            createHsCode("3901.20", "Polyethylene having a specific gravity >= 0.94, in primary forms", "39"),
            createHsCode("3902.10", "Polypropylene, in primary forms", "39"),
            createHsCode("3903.11", "Polystyrene, expandable, in primary forms", "39"),
            createHsCode("3904.10", "Polyvinyl chloride, not mixed with other substances, in primary forms", "39"),
            createHsCode("3907.60", "Polyethylene terephthalate (PET), in primary forms", "39"),
            createHsCode("3908.10", "Polyamide-6 (Nylon 6), in primary forms", "39"),
            createHsCode("3920.10", "Plates, sheets, film, of polymers of ethylene, non-cellular, not reinforced", "39"),
            createHsCode("3923.10", "Boxes, cases, crates and similar articles of plastics", "39"),
            createHsCode("3923.21", "Sacks and bags of polymers of ethylene", "39"),
            createHsCode("4001.10", "Natural rubber latex", "40"),
            createHsCode("4002.19", "Other synthetic rubber, n.e.c.", "40"),
            createHsCode("4011.10", "New pneumatic tyres, of rubber, of a kind used on motor cars", "40"),

            // Wood (Ch 44)
            createHsCode("4407.10", "Wood sawn or chipped lengthwise, of coniferous species, thickness > 6 mm", "44"),
            createHsCode("4410.11", "Particle board of wood, not overlaid, thickness <= 5 mm", "44"),

            // Paper (Ch 48-49)
            createHsCode("4801.00", "Newsprint, in rolls or sheets", "48"),
            createHsCode("4802.54", "Uncoated paper and paperboard, of a kind used for graphic printing, weight 40-150 g/m2", "48"),
            createHsCode("4804.11", "Uncoated kraft paper, unbleached, weight <= 150 g/m2", "48"),
            createHsCode("4819.10", "Cartons, boxes and cases, of corrugated paper or paperboard", "48"),
            createHsCode("4819.20", "Cartons, boxes and cases, of non-corrugated paper or paperboard", "48"),
            createHsCode("4821.10", "Paper labels, printed", "48"),
            createHsCode("4901.99", "Printed books, brochures and similar printed matter, n.e.c.", "49"),

            // Textiles & apparel (Ch 50-63)
            createHsCode("5201.00", "Cotton, not carded or combed", "52"),
            createHsCode("5208.11", "Woven fabrics of cotton, containing >= 85% by weight of cotton, weight <= 200 g/m2, unbleached", "52"),
            createHsCode("5402.33", "Textured yarn of polyester, not for retail sale", "54"),
            createHsCode("5407.61", "Woven fabrics of synthetic filament yarn, containing >= 85% by weight of textured polyester", "54"),
            createHsCode("5407.74", "Woven fabrics of synthetic filament yarn, containing >= 85% by weight of other polyester", "54"),
            createHsCode("5513.11", "Woven fabrics of synthetic staple fibres, containing < 85% polyester, mixed with cotton, <= 170 g/m2", "55"),
            createHsCode("6109.10", "T-shirts, singlets and other vests, of cotton, knitted", "61"),
            createHsCode("6110.20", "Jerseys, pullovers etc. of cotton, knitted", "61"),
            createHsCode("6110.30", "Jerseys, pullovers etc. of man-made fibres, knitted", "61"),
            createHsCode("6203.42", "Men's or boys' trousers etc. of cotton, not knitted", "62"),
            createHsCode("6204.62", "Women's or girls' trousers etc. of cotton, not knitted", "62"),
            createHsCode("6205.20", "Men's or boys' shirts of cotton, not knitted", "62"),
            createHsCode("6302.31", "Bed linen of cotton, knitted", "63"),
            createHsCode("6304.92", "Curtains and interior textile furnishings of cotton, not knitted", "63"),

            // Footwear (Ch 64)
            createHsCode("6403.19", "Footwear with outer soles of rubber or plastics and uppers of leather, n.e.c.", "64"),

            // Stone, ceramic, glass (Ch 68-70)
            createHsCode("6810.11", "Building blocks and bricks of cement, concrete or artificial stone", "68"),
            createHsCode("6907.21", "Ceramic tiles, glazed", "69"),
            createHsCode("7005.29", "Float glass and surface ground glass, in sheets, n.e.c.", "70"),

            // Iron, steel & articles (Ch 72-73)
            createHsCode("7207.11", "Semi-finished products of iron or non-alloy steel, rectangular cross-section", "72"),
            createHsCode("7208.36", "Flat-rolled products of iron or non-alloy steel, hot-rolled, thickness < 3 mm, n.e.c.", "72"),
            createHsCode("7208.39", "Flat-rolled products of iron or non-alloy steel, hot-rolled, n.e.c.", "72"),
            createHsCode("7209.16", "Flat-rolled products of iron or non-alloy steel, cold-rolled, thickness >= 0.5 mm but <= 1 mm", "72"),
            createHsCode("7210.49", "Flat-rolled products of iron or non-alloy steel, plated or coated with zinc, n.e.c.", "72"),
            createHsCode("7213.10", "Bars and rods, hot-rolled, of iron or non-alloy steel, in coils, with indentations", "72"),
            createHsCode("7225.40", "Flat-rolled products of other alloy steel, hot-rolled, width >= 600 mm", "72"),
            createHsCode("7304.31", "Tubes, pipes and hollow profiles, of iron or steel, cold-drawn, for boilers", "73"),
            createHsCode("7308.90", "Structures and parts of structures, of iron or steel, n.e.c.", "73"),
            createHsCode("7318.15", "Other screws and bolts of iron or steel, whether or not with nuts or washers", "73"),

            // Aluminum (Ch 76)
            createHsCode("7604.29", "Aluminium bars, rods and profiles, alloyed, n.e.c.", "76"),
            createHsCode("7606.12", "Aluminium plates, sheets and strip, of thickness > 0.2 mm, alloyed", "76"),
            createHsCode("7607.11", "Aluminium foil (<= 0.2 mm), backed", "76"),
            createHsCode("7607.19", "Aluminium foil (<= 0.2 mm), not backed, n.e.c.", "76"),
            createHsCode("7610.10", "Aluminium doors, windows and their frames", "76"),

            // Tools & metal articles (Ch 82-83)
            createHsCode("8204.11", "Hand-operated spanners and wrenches", "82"),
            createHsCode("8302.41", "Base metal mountings, fittings and similar articles suitable for furniture, n.e.c.", "83"),

            // Machinery & mechanical appliances (Ch 84)
            createHsCode("8407.34", "Spark-ignition reciprocating internal combustion piston engines, cylinder capacity > 1000 cc", "84"),
            createHsCode("8408.20", "Compression-ignition internal combustion piston engines (diesel), for vehicles of Ch.87", "84"),
            createHsCode("8413.70", "Other pumps for liquids", "84"),
            createHsCode("8414.59", "Other fans, n.e.c.", "84"),
            createHsCode("8415.81", "Air conditioning machines, other than window or wall types", "84"),
            createHsCode("8418.10", "Combined refrigerator-freezers, separate external doors", "84"),
            createHsCode("8418.69", "Other refrigerating or freezing equipment, n.e.c.", "84"),
            createHsCode("8419.89", "Machinery for treatment of materials by change of temperature, n.e.c.", "84"),
            createHsCode("8421.21", "Machinery for filtering or purifying water", "84"),
            createHsCode("8421.99", "Parts of filtering or purifying machinery, n.e.c.", "84"),
            createHsCode("8422.30", "Machinery for filling, closing, sealing or labelling bottles", "84"),
            createHsCode("8427.10", "Fork-lift trucks, non-self-propelled", "84"),
            createHsCode("8431.31", "Parts of boring or sinking machinery, self-propelled", "84"),
            createHsCode("8443.31", "Machines used for printing by ink jet", "84"),
            createHsCode("8471.30", "Digital automatic data processing machines, portable, <= 10 kg", "84"),
            createHsCode("8471.50", "Digital processing units other than those of 8471.41 or 8471.49", "84"),
            createHsCode("8477.10", "Extruders for working rubber or plastics", "84"),
            createHsCode("8479.89", "Machines and mechanical appliances having individual functions, n.e.c.", "84"),
            createHsCode("8481.80", "Taps, cocks, valves and similar appliances, n.e.c.", "84"),

            // Electrical equipment & electronics (Ch 85)
            createHsCode("8501.10", "Electric motors, output <= 37.5 W", "85"),
            createHsCode("8501.61", "AC generators (alternators), output <= 75 kVA", "85"),
            createHsCode("8504.10", "Ballasts for discharge lamps or tubes", "85"),
            createHsCode("8504.31", "Electrical transformers, power handling capacity <= 1 kVA", "85"),
            createHsCode("8504.40", "Static converters (e.g. rectifiers)", "85"),
            createHsCode("8507.10", "Lead-acid accumulators, for starting piston engines", "85"),
            createHsCode("8507.60", "Lithium-ion accumulators", "85"),
            createHsCode("8507.80", "Other electric accumulators", "85"),
            createHsCode("8517.12", "Telephones for cellular networks or for other wireless networks", "85"),
            createHsCode("8517.62", "Other machines for the reception, conversion and transmission of voice, images or other data", "85"),
            createHsCode("8523.51", "Solid-state non-volatile storage devices (e.g. USB flash drives, SSDs)", "85"),
            createHsCode("8525.89", "Other video camera recorders", "85"),
            createHsCode("8528.72", "Television receivers, colour, not combined with radio-broadcast receivers", "85"),
            createHsCode("8536.10", "Fuses and fuse-holders, voltage <= 1,000 V", "85"),
            createHsCode("8536.41", "Relays, voltage <= 60 V", "85"),
            createHsCode("8536.50", "Switches, voltage <= 1,000 V", "85"),
            createHsCode("8541.40", "Photosensitive semiconductor devices, including photovoltaic cells; LED", "85"),
            createHsCode("8541.49", "Other semiconductor devices (diodes, transistors), n.e.c.", "85"),
            createHsCode("8542.31", "Electronic integrated circuits — processors and controllers", "85"),
            createHsCode("8542.32", "Electronic integrated circuits — memories", "85"),
            createHsCode("8542.39", "Other electronic integrated circuits", "85"),
            createHsCode("8544.11", "Insulated winding wire of copper, conductor <= 0.8 mm", "85"),
            createHsCode("8544.42", "Other insulated electric conductors, fitted with connectors, voltage <= 80 V", "85"),
            createHsCode("8544.49", "Other insulated electric conductors, voltage <= 80 V, n.e.c.", "85"),
            createHsCode("8544.60", "Other insulated electric conductors, voltage > 1,000 V", "85"),

            // Vehicles & transport (Ch 86-89)
            createHsCode("8601.10", "Railway locomotives, powered from an external electric source", "86"),
            createHsCode("8701.20", "Road tractors for semi-trailers", "87"),
            createHsCode("8702.10", "Motor vehicles for transport of >= 10 persons, with compression-ignition engine (diesel)", "87"),
            createHsCode("8703.22", "Motor cars, spark-ignition, cylinder capacity 1000-1500 cc", "87"),
            createHsCode("8703.23", "Motor cars, spark-ignition, cylinder capacity 1500-3000 cc", "87"),
            createHsCode("8703.24", "Motor cars, spark-ignition, cylinder capacity > 3000 cc", "87"),
            createHsCode("8703.31", "Motor cars, compression-ignition (diesel), cylinder capacity <= 1500 cc", "87"),
            createHsCode("8703.32", "Motor cars, compression-ignition (diesel), cylinder capacity 1500-2500 cc", "87"),
            createHsCode("8703.33", "Motor cars, compression-ignition (diesel), cylinder capacity 2500-3000 cc", "87"),
            createHsCode("8703.40", "Motor cars, hybrid, with both spark-ignition and electric motor", "87"),
            createHsCode("8703.60", "Motor cars, with both compression-ignition and electric motor", "87"),
            createHsCode("8703.80", "Motor cars, with electric motor for propulsion", "87"),
            createHsCode("8704.21", "Motor vehicles for transport of goods, diesel, GVW <= 5 tonnes", "87"),
            createHsCode("8704.22", "Motor vehicles for transport of goods, diesel, GVW 5-20 tonnes", "87"),
            createHsCode("8704.23", "Motor vehicles for transport of goods, diesel, GVW > 20 tonnes", "87"),
            createHsCode("8708.10", "Bumpers and parts thereof for motor vehicles", "87"),
            createHsCode("8708.21", "Safety seat belts for motor vehicles", "87"),
            createHsCode("8708.29", "Other parts and accessories of bodies for motor vehicles", "87"),
            createHsCode("8708.30", "Brakes and servo-brakes and parts thereof for motor vehicles", "87"),
            createHsCode("8708.40", "Gear boxes and parts thereof for motor vehicles", "87"),
            createHsCode("8708.70", "Road wheels and parts and accessories thereof for motor vehicles", "87"),
            createHsCode("8708.80", "Suspension systems and parts thereof for motor vehicles", "87"),
            createHsCode("8708.91", "Radiators and parts thereof for motor vehicles", "87"),
            createHsCode("8708.99", "Other parts and accessories for motor vehicles, n.e.c.", "87"),
            createHsCode("8711.10", "Motorcycles, with reciprocating internal combustion engine, cylinder capacity <= 50 cc", "87"),
            createHsCode("8711.60", "Motorcycles with electric motor", "87"),
            createHsCode("8716.39", "Other trailers and semi-trailers for transport of goods", "87"),
            createHsCode("8802.40", "Aeroplanes and other aircraft, of an unladen weight > 15,000 kg", "88"),
            createHsCode("8901.10", "Cruise ships, excursion boats and similar vessels for transport of persons", "89"),

            // Optical, medical & instruments (Ch 90)
            createHsCode("9001.90", "Other optical elements, n.e.c.", "90"),
            createHsCode("9018.31", "Syringes, with or without needles", "90"),
            createHsCode("9018.90", "Other instruments and appliances for medical, surgical or dental use, n.e.c.", "90"),
            createHsCode("9021.50", "Hearing aids, excluding parts and accessories", "90"),
            createHsCode("9022.12", "Apparatus based on the use of X-rays, for medical use", "90"),
            createHsCode("9031.49", "Other measuring or checking instruments and machines, n.e.c.", "90"),

            // Furniture & lighting (Ch 94)
            createHsCode("9401.31", "Seats of metal, upholstered", "94"),
            createHsCode("9401.50", "Seats of cane, osier, bamboo or similar materials", "94"),
            createHsCode("9403.10", "Metal furniture of a kind used in offices", "94"),
            createHsCode("9403.30", "Wooden furniture of a kind used in offices", "94"),
            createHsCode("9403.50", "Wooden furniture of a kind used in bedrooms", "94"),
            createHsCode("9403.60", "Other wooden furniture, n.e.c.", "94"),
            createHsCode("9405.11", "LED lamps (light emitting diode light sources)", "94"),
            createHsCode("9405.40", "Other electric lamps and lighting fittings, n.e.c.", "94"),

            // Toys & misc (Ch 95-96)
            createHsCode("9503.00", "Tricycles, scooters and similar wheeled toys; dolls; puzzles; other toys", "95"),
            createHsCode("9504.50", "Video game consoles and machines, n.e.c.", "95"),
            createHsCode("9608.10", "Ball point pens", "96")
        );

        hsCodeRepository.saveAll(codes);
    }

    private HsCode createHsCode(String code, String description, String chapter) {
        return new HsCode(code, description, chapter);
    }

    // ---- Tariff Rates ----

    private void seedTariffRates() {
        if (tariffRateRepository.count() > 0) return;

        // Origins must be seeded first so we can reference them
        if (originRepository.count() == 0) {
            seedOrigins();
        }
        Origin china = originRepository.findById(1L).orElse(null);
        // Find China by code since we can't rely on specific IDs
        for (Origin o : originRepository.findAll()) {
            if ("CN".equals(o.getCode())) { china = o; break; }
        }
        Origin eu = null;
        for (Origin o : originRepository.findAll()) {
            if ("FR".equals(o.getCode())) { eu = o; break; }
        }

        List<TariffRate> rates = List.of(
            // Origin-specific rates (CN - China)
            createTariff("8471.30", "Ordinateurs portables, poids ≤ 10 kg (Chine)", new BigDecimal("2.5000"), new BigDecimal("20.00"), "U", china),
            createTariff("6109.10", "T-shirts en coton, bonneterie (Chine)", new BigDecimal("30.0000"), new BigDecimal("20.00"), "U", china),
            createTariff("8703.23", "Voitures de tourisme, cylindrée 1500-3000 cm³ (Chine)", new BigDecimal("35.0000"), new BigDecimal("20.00"), "U", china),

            // Origin-specific rates (FR - France/EU)
            createTariff("8703.23", "Voitures de tourisme, cylindrée 1500-3000 cm³ (France)", new BigDecimal("17.5000"), new BigDecimal("20.00"), "U", eu),

            // General rates (no origin — applies to any origin without a specific tariff)
            createTariff("1001.19", "Blé dur (autre que de semence)", new BigDecimal("30.0000"), new BigDecimal("10.00"), "T", null),
            createTariff("1507.10", "Huile de soja brute, même dégommée", new BigDecimal("20.0000"), new BigDecimal("10.00"), "L", null),
            createTariff("2709.00", "Huiles brutes de pétrole", new BigDecimal("5.0000"), new BigDecimal("14.00"), "L", null),
            createTariff("3004.90", "Médicaments, conditionnés pour la vente au détail", new BigDecimal("5.0000"), new BigDecimal("0.00"), "KG", null),
            createTariff("8413.70", "Pompes centrifuges", new BigDecimal("17.0000"), new BigDecimal("20.00"), "U", null),
            createTariff("8471.30", "Ordinateurs portables, poids ≤ 10 kg", new BigDecimal("0.0000"), new BigDecimal("20.00"), "U", null),
            createTariff("9403.30", "Meubles en bois pour bureaux", new BigDecimal("25.0000"), new BigDecimal("20.00"), "KG", null),
            createTariff("6109.10", "T-shirts en coton, bonneterie", new BigDecimal("25.0000"), new BigDecimal("20.00"), "U", null),
            createTariff("0805.10", "Oranges fraîches ou sèches", new BigDecimal("10.0000"), new BigDecimal("10.00"), "KG", null),
            createTariff("8703.23", "Voitures de tourisme, cylindrée 1500-3000 cm³", new BigDecimal("25.0000"), new BigDecimal("20.00"), "U", null),

            // Global default (no origin, no HS code)
            createTariff(null, "Tarif par défaut (tous produits, toutes origines)", new BigDecimal("10.0000"), new BigDecimal("20.00"), "U", null)
        );

        tariffRateRepository.saveAll(rates);
    }

    private TariffRate createTariff(String hsCode, String description, BigDecimal dutyRate, BigDecimal vatRate, String unit, Origin origin) {
        TariffRate rate = new TariffRate();
        rate.setHsCode(hsCode);
        rate.setDescription(description);
        rate.setDutyRate(dutyRate);
        rate.setVatRate(vatRate);
        rate.setUnit(unit);
        rate.setOrigin(origin);
        rate.setActive(true);
        return rate;
    }

    // ---- Job Configs ----

    private void seedJobConfigs() {
        if (jobConfigRepository.count() > 0) return;

        // VLM retry job is disabled by default — admin must enable it
        jobConfigRepository.save(new JobConfig("vlm-retry", false));
    }

    // ---- AI Models ----

    private void seedAiModels() {
        if (aiModelRepository.count() > 0) return;

        // Real API keys are loaded from backend/ai-keys.csv at startup.
        // Copy backend/ai-keys.csv.sample to backend/ai-keys.csv and fill in real keys.
        // Format: provider;model;key
        // until then, models are seeded with placeholder keys — edit them in the admin UI.
        record SeedModel(String provider, String model, String url, String placeholderKey, String type,
                         String deployment, Integer callOrder) {}

        List<SeedModel> seeds = List.of(
            new SeedModel("Together AI", "google/gemma-4-31B-it",
                "https://api.together.ai/v1", "PLACEHOLDER-TOGETHER-1", "VLM", "serverless", 1),
            new SeedModel("Together AI", "moonshotai/Kimi-K2.6",
                "https://api.together.ai/v1", "PLACEHOLDER-TOGETHER-2", "VLM", "serverless", 2),
            new SeedModel("Fireworks AI", "accounts/fireworks/models/kimi-k2p6",
                "https://api.fireworks.ai/inference/v1", "PLACEHOLDER-FIREWORKS-1", "VLM", "serverless", 3),
            new SeedModel("Fireworks AI", "accounts/fireworks/models/qwen3p6-plus",
                "https://api.fireworks.ai/inference/v1", "PLACEHOLDER-FIREWORKS-2", "VLM", "serverless", 4),
            new SeedModel("HuggingFace", "unsloth/Qwen3.6-27B-MTP-GGUF",
                "https://xw1di2s2tvxquwea.us-east-1.aws.endpoints.huggingface.cloud", "PLACEHOLDER-HF", "VLM", "dedicated", 5)
        );

        List<AiModel> models = seeds.stream().map(s -> new AiModel(
                s.provider, s.model, s.url,
                aiKeyLoader.getKey(s.provider, s.model, s.placeholderKey),
                s.type, true, s.deployment, s.callOrder
        )).toList();

        aiModelRepository.saveAll(models);
    }

    // ---- Origins ----

    private void seedOrigins() {
        if (originRepository.count() > 0) return;

        List<Origin> origins = List.of(
            new Origin("AD", "Andorra"), new Origin("AE", "United Arab Emirates"), new Origin("AF", "Afghanistan"),
            new Origin("AG", "Antigua & Barbuda"), new Origin("AL", "Albania"), new Origin("AM", "Armenia"),
            new Origin("AO", "Angola"), new Origin("AR", "Argentina"), new Origin("AT", "Austria"),
            new Origin("AU", "Australia"), new Origin("AZ", "Azerbaijan"), new Origin("BE", "Belgium"),
            new Origin("BF", "Burkina Faso"), new Origin("BG", "Bulgaria"), new Origin("BH", "Bahrain"),
            new Origin("BI", "Burundi"), new Origin("BJ", "Benin"), new Origin("BN", "Brunei"),
            new Origin("BO", "Bolivia"), new Origin("BR", "Brazil"), new Origin("BW", "Botswana"),
            new Origin("CA", "Canada"), new Origin("CD", "Congo (DRC)"), new Origin("CF", "Central African Rep."),
            new Origin("CG", "Congo (Rep.)"), new Origin("CH", "Switzerland"), new Origin("CI", "Côte d'Ivoire"),
            new Origin("CL", "Chile"), new Origin("CM", "Cameroon"), new Origin("CN", "China"),
            new Origin("CO", "Colombia"), new Origin("CR", "Costa Rica"), new Origin("CU", "Cuba"),
            new Origin("CY", "Cyprus"), new Origin("CZ", "Czech Republic"), new Origin("DE", "Germany"),
            new Origin("DJ", "Djibouti"), new Origin("DK", "Denmark"), new Origin("DZ", "Algeria"),
            new Origin("EC", "Ecuador"), new Origin("EE", "Estonia"), new Origin("EG", "Egypt"),
            new Origin("ER", "Eritrea"), new Origin("ES", "Spain"), new Origin("ET", "Ethiopia"),
            new Origin("FI", "Finland"), new Origin("FR", "France"), new Origin("GA", "Gabon"),
            new Origin("GB", "United Kingdom"), new Origin("GH", "Ghana"), new Origin("GM", "Gambia"),
            new Origin("GN", "Guinea"), new Origin("GQ", "Equatorial Guinea"), new Origin("GR", "Greece"),
            new Origin("GT", "Guatemala"), new Origin("HK", "Hong Kong"), new Origin("HN", "Honduras"),
            new Origin("HR", "Croatia"), new Origin("HT", "Haiti"), new Origin("HU", "Hungary"),
            new Origin("ID", "Indonesia"), new Origin("IE", "Ireland"), new Origin("IL", "Israel"),
            new Origin("IN", "India"), new Origin("IQ", "Iraq"), new Origin("IR", "Iran"),
            new Origin("IS", "Iceland"), new Origin("IT", "Italy"), new Origin("JM", "Jamaica"),
            new Origin("JO", "Jordan"), new Origin("JP", "Japan"), new Origin("KE", "Kenya"),
            new Origin("KH", "Cambodia"), new Origin("KM", "Comoros"), new Origin("KR", "South Korea"),
            new Origin("KW", "Kuwait"), new Origin("KZ", "Kazakhstan"), new Origin("LA", "Laos"),
            new Origin("LB", "Lebanon"), new Origin("LK", "Sri Lanka"), new Origin("LR", "Liberia"),
            new Origin("LT", "Lithuania"), new Origin("LU", "Luxembourg"), new Origin("LV", "Latvia"),
            new Origin("LY", "Libya"), new Origin("MA", "Morocco"), new Origin("MD", "Moldova"),
            new Origin("MG", "Madagascar"), new Origin("ML", "Mali"), new Origin("MM", "Myanmar"),
            new Origin("MR", "Mauritania"), new Origin("MT", "Malta"), new Origin("MU", "Mauritius"),
            new Origin("MW", "Malawi"), new Origin("MX", "Mexico"), new Origin("MY", "Malaysia"),
            new Origin("MZ", "Mozambique"), new Origin("NA", "Namibia"), new Origin("NE", "Niger"),
            new Origin("NG", "Nigeria"), new Origin("NI", "Nicaragua"), new Origin("NL", "Netherlands"),
            new Origin("NO", "Norway"), new Origin("NP", "Nepal"), new Origin("NZ", "New Zealand"),
            new Origin("OM", "Oman"), new Origin("PA", "Panama"), new Origin("PE", "Peru"),
            new Origin("PH", "Philippines"), new Origin("PK", "Pakistan"), new Origin("PL", "Poland"),
            new Origin("PT", "Portugal"), new Origin("PY", "Paraguay"), new Origin("QA", "Qatar"),
            new Origin("RO", "Romania"), new Origin("RS", "Serbia"), new Origin("RU", "Russia"),
            new Origin("RW", "Rwanda"), new Origin("SA", "Saudi Arabia"), new Origin("SD", "Sudan"),
            new Origin("SE", "Sweden"), new Origin("SG", "Singapore"), new Origin("SI", "Slovenia"),
            new Origin("SK", "Slovakia"), new Origin("SL", "Sierra Leone"), new Origin("SN", "Senegal"),
            new Origin("SO", "Somalia"), new Origin("SR", "Suriname"), new Origin("SV", "El Salvador"),
            new Origin("SY", "Syria"), new Origin("SZ", "Eswatini"), new Origin("TD", "Chad"),
            new Origin("TG", "Togo"), new Origin("TH", "Thailand"), new Origin("TJ", "Tajikistan"),
            new Origin("TM", "Turkmenistan"), new Origin("TN", "Tunisia"), new Origin("TR", "Turkey"),
            new Origin("TT", "Trinidad & Tobago"), new Origin("TW", "Taiwan"), new Origin("TZ", "Tanzania"),
            new Origin("UA", "Ukraine"), new Origin("UG", "Uganda"), new Origin("US", "United States"),
            new Origin("UY", "Uruguay"), new Origin("UZ", "Uzbekistan"), new Origin("VE", "Venezuela"),
            new Origin("VN", "Vietnam"), new Origin("YE", "Yemen"), new Origin("ZA", "South Africa"),
            new Origin("ZM", "Zambia"), new Origin("ZW", "Zimbabwe")
        );

        originRepository.saveAll(origins);
    }

    // ---- Users ----

    private void seedUsers() {
        if (userRepository.count() > 0) return;

        Company smie = companyRepository.findByKey("SMIE").orElse(null);
        Company afl = companyRepository.findByKey("AFL").orElse(null);
        Company clg = companyRepository.findByKey("CLG").orElse(null);

        CustomsOffice casaPort = customsOfficeRepository.findByCode("CASA-P").orElse(null);
        CustomsOffice casaAirport = customsOfficeRepository.findByCode("CASA-A").orElse(null);
        CustomsOffice tangerMed = customsOfficeRepository.findByCode("TANGER-P").orElse(null);

        List<User> users = List.of(
            // Admin
            createUser("admin", "admin@diwana.ma", "Admin", "User", User.Role.ADMIN, null, null),
            // SMIE declarants
            createUser("ahmed", "ahmed@smie.ma", "Ahmed", "Benali", User.Role.DECLARANT, smie, null),
            createUser("fatima", "fatima@smie.ma", "Fatima", "Zahra", User.Role.DECLARANT, smie, null),
            // AFL declarants
            createUser("youssef", "youssef@afl.ma", "Youssef", "El Amrani", User.Role.DECLARANT, afl, null),
            createUser("nadia", "nadia@afl.ma", "Nadia", "Bouazza", User.Role.DECLARANT, afl, null),
            // CLG declarants
            createUser("karim", "karim@clg.ma", "Karim", "Ouazzani", User.Role.DECLARANT, clg, null),
            createUser("samira", "samira@clg.ma", "Samira", "Benjelloun", User.Role.DECLARANT, clg, null),
            // Controllers (no company — they are customs officers assigned to offices)
            createUser("hicham", "hicham@douane.gov.ma", "Hicham", "Tazi", User.Role.CONTROLLER, null, casaPort),
            createUser("latifa", "latifa@douane.gov.ma", "Latifa", "El Fassi", User.Role.CONTROLLER, null, casaAirport)
        );

        userRepository.saveAll(users);
    }

    private User createUser(String username, String email, String firstName, String lastName, User.Role role, Company company, CustomsOffice customsOffice) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        user.setCompany(company);
        user.setCustomsOffice(customsOffice);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setActive(true);
        return user;
    }
}
