-- name: InsertUser :exec
insert into users (id) values ($1);

-- name: InsertUserProile :exec
insert into user_profile (id, user_id, email, name) values ($1, $2, $3, $4);

-- name: SelectLatestUserProfileByEmail :one
select * from user_profile
where email = $1
order by created_at desc
limit 1;

-- name: DeleteUser :exec
insert into user_delete (id, user_id) values ($1, $2);

-- name: DeleteUserProfile :exec
delete from user_profile where id = $1;
