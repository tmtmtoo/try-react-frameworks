-- name: GetUser :one
select
    user_id as id,
    email,
    name,
    max(created_at) as created_at
from user_profile
where id = $1;
