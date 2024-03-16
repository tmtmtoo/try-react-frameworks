-- name: GetUser :one
select
    user_id as id,
    email,
    name,
    created_at
from user_profile
where id = $1
order by created_at desc
limit 1;
