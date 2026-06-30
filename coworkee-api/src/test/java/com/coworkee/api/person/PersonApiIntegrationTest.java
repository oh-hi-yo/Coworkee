package com.coworkee.api.person;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coworkee.api.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

class PersonApiIntegrationTest extends AbstractIntegrationTest {

    // Seed fixture: Benjamin Banks (deterministic V2 seed).
    private static final String BANKS_ID = "a6987240-610f-4dc6-b0a7-3d53d47591ad";
    private static final String BANKS_USERNAME = "benjamin.banks";
    private static final String BANKS_EMAIL = "benjamin.banks@extjsdemo.com";
    // Seed office/organization ids for create payloads.
    private static final String OFFICE_ID = "2725949a-a1a5-45f8-ab29-4605629f9b49";
    private static final String ORG_ID = "9f2cea7a-2147-4a3f-aebf-f0956591c6e8";

    @Test
    void list_requires_authentication() throws Exception {
        mockMvc.perform(get("/api/people")).andExpect(status().isUnauthorized());
    }

    @Test
    void list_returns_seed_with_envelope_and_default_lastname_sort() throws Exception {
        mockMvc.perform(get("/api/people").param("size", "10").with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(51))
                .andExpect(jsonPath("$.data", hasSize(10)))
                // default sort = lastname asc
                .andExpect(jsonPath("$.data[0].lastname").value("Armstrong"));
    }

    @Test
    void list_paging_and_total() throws Exception {
        mockMvc.perform(get("/api/people").param("page", "1").param("size", "20").with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(51))
                .andExpect(jsonPath("$.data", hasSize(20)));
    }

    @Test
    void search_matches_searchable_fields() throws Exception {
        mockMvc.perform(get("/api/people").param("search", "Banks").with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].lastname").value("Banks"));
    }

    // BR-04 — id / username / email resolve to the same person.
    @Test
    void getByKey_resolves_id_username_email() throws Exception {
        for (String key : new String[] {BANKS_ID, BANKS_USERNAME, BANKS_EMAIL}) {
            mockMvc.perform(get("/api/people/{key}", key).with(viewer()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(BANKS_ID))
                    .andExpect(jsonPath("$.username").value(BANKS_USERNAME))
                    // BR-02 fullname + BR-01 url
                    .andExpect(jsonPath("$.fullname").value("Benjamin Banks"))
                    .andExpect(jsonPath("$.url").value("person/" + BANKS_ID));
        }
    }

    // picture absolute URL (legacy Sequelize getter).
    @Test
    void picture_is_absolute_url() throws Exception {
        mockMvc.perform(get("/api/people/{key}", BANKS_USERNAME).with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.picture").value(startsWith("http://localhost:8080/api/portraits/")));
    }

    @Test
    void getByKey_unknown_returns_404() throws Exception {
        mockMvc.perform(get("/api/people/{key}", "nobody@nowhere.test").with(viewer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").exists());
    }

    // BR-11 — distinct office filter options.
    @Test
    void filters_returns_office_options() throws Exception {
        mockMvc.perform(get("/api/people/filters").param("field", "office_id").with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(11)))
                .andExpect(jsonPath("$.data[*].label", everyItem(org.hamcrest.Matchers.notNullValue())));
    }

    @Test
    void filter_by_office_narrows_results() throws Exception {
        mockMvc.perform(get("/api/people").param("office_id", OFFICE_ID).param("size", "100").with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].office.id", everyItem(org.hamcrest.Matchers.is(OFFICE_ID))));
    }

    // BR-21 — generate-username (dotted seed username does not equal underscore base → base returned).
    @Test
    void generate_username_returns_sanitized_base() throws Exception {
        mockMvc.perform(get("/api/people/generate-username")
                        .param("firstname", "Benjamin").param("lastname", "Banks").with(viewer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("benjamin_banks"));
    }

    // --- write authorization (ADR-005) ---

    @Test
    void create_without_admin_role_is_forbidden() throws Exception {
        mockMvc.perform(post("/api/people").with(viewer())
                        .contentType("application/json").content(validCreateJson("a@b.co", "newuser_one")))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_with_admin_role_succeeds() throws Exception {
        mockMvc.perform(post("/api/people").with(admin())
                        .contentType("application/json")
                        .content(validCreateJson("new.person@extjsdemo.com", "new_person_one")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("new_person_one"))
                .andExpect(jsonPath("$.fullname").value("New Person"));
    }

    // BR-18 — required-field validation.
    @Test
    void create_with_blank_required_fields_is_400() throws Exception {
        String invalid = """
                {"email":"","username":"x","firstname":"","lastname":"",
                 "title":"","phone":"","birthday":null,"started":null,
                 "officeId":null,"organizationId":null}
                """;
        mockMvc.perform(post("/api/people").with(admin())
                        .contentType("application/json").content(invalid))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors", hasSize(greaterThanOrEqualTo(1))));
    }

    private static String validCreateJson(String email, String username) {
        return """
                {
                  "email": "%s",
                  "username": "%s",
                  "firstname": "New",
                  "lastname": "Person",
                  "title": "Engineer",
                  "phone": "1-555-0100",
                  "birthday": "1990-01-01",
                  "started": "2020-01-01",
                  "officeId": "%s",
                  "organizationId": "%s"
                }
                """.formatted(email, username, OFFICE_ID, ORG_ID);
    }
}
