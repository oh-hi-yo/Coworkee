-- Coworkee schema (ADR-008). Mirrors the JPA entities; Flyway owns the schema.
-- Person has no password column (ADR-004).

create table offices (
    id        uuid primary key,
    name      varchar(255) not null unique,
    address   varchar(255) not null,
    postcode  varchar(255),
    region    varchar(255),
    city      varchar(255) not null,
    country   varchar(255) not null,
    latitude  double precision,
    longitude double precision
);

create table organizations (
    id         uuid primary key,
    name       varchar(255) not null unique,
    manager_id uuid
);

create table people (
    id              uuid primary key,
    email           varchar(255) not null unique,
    username        varchar(255) not null unique,
    firstname       varchar(255) not null,
    lastname        varchar(255) not null,
    title           varchar(255),
    phone           varchar(255),
    extension       varchar(255),
    skype           varchar(255),
    linkedin        varchar(255),
    picture         varchar(255),
    birthday        date not null,
    started         date,
    ended           date,
    office_id       uuid references offices (id),
    organization_id uuid references organizations (id)
);

create table actions (
    id           uuid primary key,
    type         varchar(255) not null,
    subject      varchar(255),
    created      timestamp not null,
    recipient_id uuid references people (id)
);

alter table organizations
    add constraint fk_org_manager foreign key (manager_id) references people (id);

create index idx_people_lastname on people (lastname);
create index idx_people_office on people (office_id);
create index idx_people_organization on people (organization_id);
create index idx_actions_recipient on actions (recipient_id);
