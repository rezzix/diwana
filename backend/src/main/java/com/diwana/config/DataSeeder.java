package com.diwana.config;

import com.diwana.company.Company;
import com.diwana.company.CompanyRepository;
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

    public DataSeeder(PasswordEncoder passwordEncoder,
                      UserRepository userRepository,
                      CompanyRepository companyRepository,
                      TariffRateRepository tariffRateRepository,
                      OriginRepository originRepository) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.tariffRateRepository = tariffRateRepository;
        this.originRepository = originRepository;
    }

    @Override
    public void run(String... args) {
        if (!"dev".equals(mode)) {
            return;
        }

        seedCompanies();
        seedOrigins();
        seedTariffRates();
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

        List<User> users = List.of(
            // Admin
            createUser("admin", "admin@diwana.ma", "Admin", "User", User.Role.ADMIN, null),
            // SMIE declarants
            createUser("ahmed", "ahmed@smie.ma", "Ahmed", "Benali", User.Role.DECLARANT, smie),
            createUser("fatima", "fatima@smie.ma", "Fatima", "Zahra", User.Role.DECLARANT, smie),
            // AFL declarants
            createUser("youssef", "youssef@afl.ma", "Youssef", "El Amrani", User.Role.DECLARANT, afl),
            createUser("nadia", "nadia@afl.ma", "Nadia", "Bouazza", User.Role.DECLARANT, afl),
            // CLG declarants
            createUser("karim", "karim@clg.ma", "Karim", "Ouazzani", User.Role.DECLARANT, clg),
            createUser("samira", "samira@clg.ma", "Samira", "Benjelloun", User.Role.DECLARANT, clg),
            // Controllers (no company — they are customs officers)
            createUser("hicham", "hicham@douane.gov.ma", "Hicham", "Tazi", User.Role.CONTROLLER, null),
            createUser("latifa", "latifa@douane.gov.ma", "Latifa", "El Fassi", User.Role.CONTROLLER, null)
        );

        userRepository.saveAll(users);
    }

    private User createUser(String username, String email, String firstName, String lastName, User.Role role, Company company) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(role);
        user.setCompany(company);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setActive(true);
        return user;
    }
}
