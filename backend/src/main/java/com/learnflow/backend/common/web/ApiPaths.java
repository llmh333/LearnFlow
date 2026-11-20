package com.learnflow.backend.common.web;

/**
 * Every HTTP path of the API, in one place. Controllers, security rules and filters reference these
 * constants; no other class writes a path literal.
 *
 * <p>Annotation values must be compile-time constants, so these are {@code static final String}
 * fields rather than enum values. Each version is a nested class matching the controller package
 * {@code <module>.api.vN}. A module's {@code BASE} is the class-level {@code @RequestMapping}; the
 * other fields are the method-level paths relative to it.
 */
public final class ApiPaths {

    public static final String ROOT = "/api";

    private ApiPaths() {}

    public static final class V1 {

        public static final String ROOT = ApiPaths.ROOT + "/v1";

        private V1() {}

        public static final class Health {
            public static final String BASE = V1.ROOT + "/health";

            private Health() {}
        }

        public static final class Auth {
            public static final String BASE = V1.ROOT + "/auth";
            public static final String REGISTER = "/register";
            public static final String LOGIN = "/login";
            public static final String REFRESH = "/refresh";
            public static final String LOGOUT = "/logout";
            public static final String CHANGE_PASSWORD = "/change-password";
            public static final String PASSWORD_RESET_REQUEST = "/password-reset/request";
            public static final String PASSWORD_RESET_VERIFY = "/password-reset/verify";
            public static final String PASSWORD_RESET_CONFIRM = "/password-reset/confirm";
            public static final String ME = "/me";

            private Auth() {}
        }

        public static final class Account {
            public static final String BASE = V1.ROOT + "/account";
            public static final String PROFILE = "/profile";

            private Account() {}
        }

        public static final class Languages {
            public static final String BASE = V1.ROOT + "/languages";

            private Languages() {}
        }

        public static final class Curriculum {
            public static final String BASE = V1.ROOT + "/curriculum";
            public static final String COURSES = "/courses";
            public static final String SOURCES = "/sources";

            private Curriculum() {}
        }

        public static final class Ai {
            public static final String BASE = V1.ROOT + "/ai";
            public static final String GRAMMAR_EXPLAIN = "/grammar/explain";
            public static final String EXAMPLES_GENERATE = "/examples/generate";
            public static final String SENTENCE_CORRECT = "/sentence/correct";
            public static final String SCENARIOS = "/scenarios";
            public static final String CONVERSATION_START = "/conversation/message";
            public static final String CONVERSATION_MESSAGE = "/conversation/{id}/message";
            public static final String CONVERSATION_STREAM = "/conversation/{id}/stream";
            public static final String CONVERSATION_END = "/conversation/{id}/end";
            public static final String CONVERSATIONS = "/conversations";
            public static final String CONVERSATION = "/conversations/{id}";

            private Ai() {}
        }
    }
}
