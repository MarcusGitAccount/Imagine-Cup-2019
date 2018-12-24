with DataSelection as (
    select
        cast(session_id as Bigint) as session_id,
        cast(child_id as Bigint) as child_id,
        comment,
        cast(avg(cast(pulse as Bigint)) as Bigint) as pulse, 
        cast(System.Timestamp as DateTime) as data_time
    from
        [RaspPiData]
    group by
        TumblingWindow(second, 15),
        comment, session_id, child_id
)

select * into [IotDataToDBUpper] from DataSelection;
select * into [IotDataToWebApp]  from DataSelection;
