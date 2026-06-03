package com.diwana.config;

import com.diwana.company.Company;
import com.diwana.company.CompanyRepository;
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

    public DataSeeder(PasswordEncoder passwordEncoder,
                      UserRepository userRepository,
                      CompanyRepository companyRepository,
                      TariffRateRepository tariffRateRepository) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.tariffRateRepository = tariffRateRepository;
    }

    @Override
    public void run(String... args) {
        if (!"dev".equals(mode)) {
            return;
        }

        seedCompanies();
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

        List<TariffRate> rates = List.of(
            createTariff("1001.19", "Blé dur (autre que de semence)", new BigDecimal("30.0000"), new BigDecimal("10.00"), "T"),
            createTariff("1507.10", "Huile de soja brute, même dégommée", new BigDecimal("20.0000"), new BigDecimal("10.00"), "L"),
            createTariff("2709.00", "Huiles brutes de pétrole", new BigDecimal("5.0000"), new BigDecimal("14.00"), "L"),
            createTariff("3004.90", "Médicaments, conditionnés pour la vente au détail", new BigDecimal("5.0000"), new BigDecimal("0.00"), "KG"),
            createTariff("8413.70", "Pompes centrifuges", new BigDecimal("17.0000"), new BigDecimal("20.00"), "U"),
            createTariff("8471.30", "Ordinateurs portables, poids ≤ 10 kg", new BigDecimal("0.0000"), new BigDecimal("20.00"), "U"),
            createTariff("8703.23", "Voitures de tourisme, cylindrée 1500-3000 cm³", new BigDecimal("25.0000"), new BigDecimal("20.00"), "U"),
            createTariff("9403.30", "Meubles en bois pour bureaux", new BigDecimal("25.0000"), new BigDecimal("20.00"), "KG"),
            createTariff("6109.10", "T-shirts en coton, bonneterie", new BigDecimal("25.0000"), new BigDecimal("20.00"), "U"),
            createTariff("0805.10", "Oranges fraîches ou sèches", new BigDecimal("10.0000"), new BigDecimal("10.00"), "KG")
        );

        tariffRateRepository.saveAll(rates);
    }

    private TariffRate createTariff(String hsCode, String description, BigDecimal dutyRate, BigDecimal vatRate, String unit) {
        TariffRate rate = new TariffRate();
        rate.setHsCode(hsCode);
        rate.setDescription(description);
        rate.setDutyRate(dutyRate);
        rate.setVatRate(vatRate);
        rate.setUnit(unit);
        rate.setActive(true);
        return rate;
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
